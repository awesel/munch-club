// Import directly from the mock files
import { 
  findPotentialMatches, 
  acceptMatch, 
  declineMatch, 
  getUserAvailability,
  getUserProfile
} from '@/__mocks__/lib/api';

// Test the behavior of our mocks
describe('Matching Algorithm', () => {
  const mockUserId = 'test-user-id';
  const otherUserId = 'other-user-id';

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('findPotentialMatches', () => {
    it('should return matches with a preferred dining hall', async () => {
      const matches = await findPotentialMatches(mockUserId);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].suggestedLocation).toBe('Arrillaga Family Dining Commons');
      expect(findPotentialMatches).toHaveBeenCalledWith(mockUserId);
    });
    
    it('should prioritize mutually liked dining halls', async () => {
      // This test relies on the implementation in the mock
      // The real implementation will be tested in integration tests
      const matches = await findPotentialMatches(mockUserId);
      expect(findPotentialMatches).toHaveBeenCalledWith(mockUserId);
      
      // Verify the match has the user with overlapping dining preferences
      expect(matches[0].matchUser.surveyData?.favoriteDiningHalls).toContain(matches[0].suggestedLocation);
    });

    it('should only create matches for times when the user is available', async () => {
      // Arrange: Set up user availability
      // We're using the mocked version which returns predefined availability:
      // '2023-08-01': ['12:00', '12:30', '13:00'],
      // '2023-08-02': ['12:00', '12:30'],
      // '2023-08-03': ['13:00', '13:30']
      const userAvailability = await getUserAvailability(mockUserId);
      
      // Act: Generate matches
      const matches = await findPotentialMatches(mockUserId);
      
      // Assert: All suggested match times should be within user's available slots
      for (const match of matches) {
        const matchDate = new Date(match.suggestedTime.seconds * 1000);
        const matchDay = matchDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const matchTime = `${matchDate.getHours().toString().padStart(2, '0')}:${
          matchDate.getMinutes().toString().padStart(2, '0')}`;
        
        // Check if the day exists in the user's availability
        expect(userAvailability.availability).toHaveProperty(matchDay);
        
        // Check if the time is in the user's available slots for that day
        expect(userAvailability.availability[matchDay]).toContain(matchTime);
      }
    });
  });

  describe('acceptMatch', () => {
    it('should accept valid matches', async () => {
      await acceptMatch(mockUserId, 'valid-match-id');
      expect(acceptMatch).toHaveBeenCalledWith(mockUserId, 'valid-match-id');
    });

    it('should throw error if match does not exist', async () => {
      await expect(acceptMatch(mockUserId, 'non-existent-match')).rejects.toThrow('Match not found');
    });

    it('should throw error if match does not belong to user', async () => {
      await expect(acceptMatch(otherUserId, 'match-id')).rejects.toThrow("You don't have permission");
    });
  });

  describe('declineMatch', () => {
    it('should decline valid matches', async () => {
      await declineMatch(mockUserId, 'valid-match-id');
      expect(declineMatch).toHaveBeenCalledWith(mockUserId, 'valid-match-id');
    });

    it('should throw error if match does not exist', async () => {
      await expect(declineMatch(mockUserId, 'non-existent-match')).rejects.toThrow('Match not found');
    });
  });
  
  describe('getUserAvailability', () => {
    it('should return null if no userId provided', async () => {
      const availability = await getUserAvailability('');
      expect(availability).toBeNull();
    });
    
    it('should return mock data for valid user', async () => {
      const availability = await getUserAvailability(mockUserId);
      expect(availability).toEqual({
        userId: mockUserId,
        weekStartDate: '2023-08-01',
        availability: expect.any(Object)
      });
    });
  });
  
  describe('getUserProfile', () => {
    it('should return profile for any user id', async () => {
      const profile = await getUserProfile('any-user');
      expect(profile).toEqual({
        uid: 'any-user',
        email: 'any-user@stanford.edu',
        displayName: expect.any(String),
        surveyCompleted: expect.any(Boolean)
      });
    });
  });
}); 