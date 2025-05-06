import { saveUserAvailability, findPotentialMatches } from '@/__mocks__/lib/api';

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