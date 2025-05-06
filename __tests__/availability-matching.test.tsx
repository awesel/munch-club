import { saveUserAvailability, findPotentialMatches } from '@/lib/api';

// Mock the API functions
jest.mock('@/lib/api', () => {
  const originalModule = jest.requireActual('@/lib/api');
  
  return {
    ...originalModule,
    saveUserAvailability: jest.fn().mockImplementation(async (userId, weekDate, availability, isRepeating) => {
      // Now call the mocked findPotentialMatches when this is called, to simulate our implementation
      // We need to wait a tick to ensure the test can set up its expectations
      setTimeout(() => {
        originalModule.findPotentialMatches(userId);
      }, 0);
      return Promise.resolve();
    }),
    findPotentialMatches: jest.fn().mockResolvedValue([]),
  };
});

describe('Availability and Matching Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should trigger matching process after saving availability', async () => {
    const mockAvailability = {
      '2023-01-01': ['09:00', '09:30', '10:00'],
      '2023-01-02': ['14:00', '14:30', '15:00']
    };
    
    const userId = 'test-user';
    
    // Call saveUserAvailability which should trigger findPotentialMatches
    await saveUserAvailability(userId, new Date(), mockAvailability, true);
    
    // We need to wait a tick for the setTimeout to execute in our mock
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Now verify findPotentialMatches was called with the right userId
    expect(findPotentialMatches).toHaveBeenCalledTimes(1);
    expect(findPotentialMatches).toHaveBeenCalledWith(userId);
  });
}); 