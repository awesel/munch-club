import { findPotentialMatches, acceptMatch, declineMatch } from '@/lib/api';
import { Timestamp } from 'firebase/firestore';

// Mock the Firebase Firestore module
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  doc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1628000000, nanoseconds: 0 })),
    fromDate: jest.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }))
  }
}));

// Mock other dependencies
jest.mock('@/lib/firebase', () => ({
  db: {}
}));

jest.mock('@/lib/api', () => {
  const originalModule = jest.requireActual('@/lib/api');
  return {
    ...originalModule,
    getUserAvailability: jest.fn(),
    getUserProfile: jest.fn()
  };
});

// Import the mocked dependencies
import { getDocs, query, where, collection, addDoc, getDoc, updateDoc, doc } from 'firebase/firestore';
import { getUserAvailability, getUserProfile } from '@/lib/api';

describe('Matching Algorithm', () => {
  const mockUserId = 'test-user-id';
  const mockAvailability = {
    userId: mockUserId,
    weekStartDate: '2023-08-01',
    availability: {
      '2023-08-01': ['12:00', '12:30', '13:00'],
      '2023-08-02': ['12:00', '12:30'],
      '2023-08-03': ['13:00', '13:30']
    }
  };

  const mockUsers = [
    {
      uid: 'user1',
      email: 'user1@stanford.edu',
      displayName: 'User One',
      surveyCompleted: true,
      surveyData: {
        mealTalkPreferences: ['Deep philosophical questions', 'News, tech, or politics'],
        conversationStyle: 'I follow their lead and keep it light',
        disagreementTolerance: 'Fine with respectful disagreement',
        conversationPace: 'Chill and meandering',
        foodPersonality: 'Adventurous, I\'ll try anything',
        companionPetPeeve: 'Be on their phone the whole time'
      }
    },
    {
      uid: 'user2',
      email: 'user2@stanford.edu',
      displayName: 'User Two',
      surveyCompleted: true,
      surveyData: {
        mealTalkPreferences: ['Personal life and emotions', 'Jokes and light banter'],
        conversationStyle: 'I crack jokes to break the ice',
        disagreementTolerance: 'Prefer to avoid it while eating',
        conversationPace: 'Fast, energetic, bouncing between topics',
        foodPersonality: 'I like my favorites and stick to them',
        companionPetPeeve: 'Dominate the conversation'
      }
    }
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock implementations
    (getUserAvailability as jest.Mock).mockResolvedValue(mockAvailability);
    (getUserProfile as jest.Mock).mockImplementation((uid) => {
      const user = mockUsers.find(u => u.uid === uid);
      return Promise.resolve(user || null);
    });

    // Mock Firestore query and docs
    (query as jest.Mock).mockReturnValue({});
    (where as jest.Mock).mockReturnValue({});
    (collection as jest.Mock).mockReturnValue({});
    (doc as jest.Mock).mockReturnValue({});

    const mockQuerySnapshot = {
      forEach: jest.fn((callback) => []),
      docs: []
    };
    (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

    // Mock adding a document
    (addDoc as jest.Mock).mockResolvedValue({ id: 'new-match-id' });

    // Mock getting a document
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        userId: mockUserId,
        matchUserId: 'user1',
        status: 'pending'
      })
    });

    // Mock updating a document
    (updateDoc as jest.Mock).mockResolvedValue(undefined);
  });

  describe('findPotentialMatches', () => {
    it('should return empty array if user has no availability', async () => {
      (getUserAvailability as jest.Mock).mockResolvedValueOnce(null);
      const matches = await findPotentialMatches(mockUserId);
      expect(matches).toEqual([]);
    });

    it('should return existing pending matches if available', async () => {
      // Mock existing matches
      const mockExistingMatches = [
        { id: 'match1', userId: mockUserId, matchUserId: 'user1', status: 'pending' }
      ];

      (getDocs as jest.Mock).mockResolvedValueOnce({
        forEach: jest.fn((callback) => mockExistingMatches.forEach(callback)),
        docs: mockExistingMatches.map(match => ({
          id: match.id,
          data: () => match
        }))
      });

      const matches = await findPotentialMatches(mockUserId);
      
      expect(matches.length).toBe(1);
      expect(matches[0].matchUser).toEqual(mockUsers[0]); // user1 profile
    });

    it('should create new matches when no pending matches exist', async () => {
      // Mock empty existing matches
      (getDocs as jest.Mock).mockResolvedValueOnce({
        forEach: jest.fn(),
        docs: []
      });

      // Mock available users with survey completed
      (getDocs as jest.Mock).mockResolvedValueOnce({
        forEach: jest.fn((callback) => mockUsers.forEach(callback)),
        docs: mockUsers.map(user => ({
          id: user.uid,
          data: () => user
        }))
      });

      // Mock empty locations
      (getDocs as jest.Mock).mockResolvedValueOnce({
        forEach: jest.fn(),
        docs: []
      });

      const matches = await findPotentialMatches(mockUserId);
      
      expect(addDoc).toHaveBeenCalledTimes(2); // One for each mock user
      expect(matches.length).toBe(2);
      expect(matches[0].matchUser).toEqual(expect.objectContaining({
        uid: expect.any(String),
        email: expect.stringContaining('@stanford.edu')
      }));
    });
  });

  describe('acceptMatch', () => {
    it('should update match status to accepted', async () => {
      await acceptMatch(mockUserId, 'match-id');
      
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'matches', 'match-id');
      expect(getDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
        status: 'accepted'
      });
    });

    it('should throw error if match does not exist', async () => {
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => false
      });

      await expect(acceptMatch(mockUserId, 'non-existent-match')).rejects.toThrow('Match not found');
    });

    it('should throw error if match does not belong to user', async () => {
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          userId: 'different-user-id',
          matchUserId: 'user1',
          status: 'pending'
        })
      });

      await expect(acceptMatch(mockUserId, 'match-id')).rejects.toThrow('You don\'t have permission');
    });
  });

  describe('declineMatch', () => {
    it('should update match status to declined', async () => {
      await declineMatch(mockUserId, 'match-id');
      
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'matches', 'match-id');
      expect(getDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
        status: 'declined'
      });
    });
  });
}); 