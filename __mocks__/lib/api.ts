// Mock api.ts
export const saveUserSurvey = jest.fn().mockResolvedValue(undefined);
export const hasCompletedSurvey = jest.fn().mockResolvedValue(false);
export const createOrUpdateUser = jest.fn().mockResolvedValue(undefined);
export const formatDateKey = jest.fn((date) => date.toISOString().split("T")[0]);

// Add matching functions
export const findPotentialMatches = jest.fn().mockImplementation((userId) => {
  // Simulate a match with overlapping dining hall preferences
  // For test purposes, make sure the suggested time matches a time in the mock availability
  // The mock getUserAvailability returns times like '12:00', '12:30', '13:00' for day '2023-08-01'
  
  // Date for Aug 1, 2023 at 12:00 (matching a time slot in the availability mock)
  const matchDate = new Date(2023, 7, 1, 12, 0); // Month is 0-indexed
  
  const mockMatch = {
    id: 'mock-match-id',
    userId,
    matchUserId: 'other-user-id',
    matchUser: {
      uid: 'other-user-id',
      email: 'other-user@stanford.edu',
      displayName: 'Other User',
      surveyCompleted: true,
      surveyData: {
        favoriteDiningHalls: ['Arrillaga Family Dining Commons', 'Stern Dining']
      }
    },
    suggestedTime: { 
      seconds: Math.floor(matchDate.getTime() / 1000), 
      nanoseconds: 0
    },
    // This would be one of the overlapping dining halls
    suggestedLocation: 'Arrillaga Family Dining Commons',
    status: 'pending',
    createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
  };
  
  // Empty array is the default, but in this case we'll return a mock match
  return Promise.resolve([mockMatch]);
});

export const acceptMatch = jest.fn().mockImplementation((userId, matchId) => {
  if (matchId === 'non-existent-match') {
    return Promise.reject(new Error('Match not found'));
  }
  if (userId !== 'test-user-id') {
    return Promise.reject(new Error("You don't have permission to accept this match"));
  }
  return Promise.resolve();
});

export const declineMatch = jest.fn().mockImplementation((userId, matchId) => {
  if (matchId === 'non-existent-match') {
    return Promise.reject(new Error('Match not found'));
  }
  if (userId !== 'test-user-id') {
    return Promise.reject(new Error("You don't have permission to decline this match"));
  }
  return Promise.resolve();
});

export const saveUserAvailability = jest.fn().mockImplementation((userId, weekDate, availability, isRepeating) => {
  // Trigger findPotentialMatches after saving
  setTimeout(() => {
    findPotentialMatches(userId);
  }, 0);
  return Promise.resolve();
});

export const getUserAvailability = jest.fn().mockImplementation((userId) => {
  if (!userId) return Promise.resolve(null);
  
  return Promise.resolve({
    userId,
    weekStartDate: '2023-08-01',
    availability: {
      '2023-08-01': ['12:00', '12:30', '13:00'],
      '2023-08-02': ['12:00', '12:30'],
      '2023-08-03': ['13:00', '13:30']
    }
  });
});

export const getUserProfile = jest.fn().mockImplementation((uid) => {
  return Promise.resolve({
    uid,
    email: `${uid}@stanford.edu`,
    displayName: `User ${uid}`,
    surveyCompleted: true
  });
});

// Add a test
describe('API Mock', () => {
  test('mock functions are defined', () => {
    expect(saveUserSurvey).toBeDefined();
    expect(hasCompletedSurvey).toBeDefined();
    expect(createOrUpdateUser).toBeDefined();
    expect(formatDateKey).toBeDefined();
    expect(findPotentialMatches).toBeDefined();
    expect(acceptMatch).toBeDefined();
    expect(declineMatch).toBeDefined();
    expect(saveUserAvailability).toBeDefined();
    expect(getUserAvailability).toBeDefined();
    expect(getUserProfile).toBeDefined();
  });
}); 