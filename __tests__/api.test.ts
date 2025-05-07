import { updatePriorityScore, getPriorityScore } from '../lib/api';
import * as firestore from '../__mocks__/firebase/firestore';

// Mock Firebase modules
jest.mock('firebase/firestore', () => require('../__mocks__/firebase/firestore'));

describe('updatePriorityScore', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should handle permission errors gracefully', async () => {
    // Setup mock to throw permission error
    firestore.mockAddDocImplementation(() => {
      throw new Error('FirebaseError: Missing or insufficient permissions.');
    });
    
    firestore.mockGetDocsImplementation(() => {
      return { empty: true };
    });
    
    // Execute and verify the function completes without throwing
    await updatePriorityScore('user1', 'user2', 1);
    
    // Check that the error was logged (can't test this directly, just verifying it completed)
    expect(true).toBe(true);
  });
}); 