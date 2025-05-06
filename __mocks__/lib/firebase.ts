// Mock firebase.ts
// This avoids actual Firebase initialization during tests
const mockDb = {
  collection: jest.fn().mockReturnValue({
    doc: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({})
      }),
      set: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({})
    })
  })
};

const mockAuth = {
  currentUser: { uid: 'test-user-id' },
  onAuthStateChanged: jest.fn()
};

const mockApp = {};

export { mockApp as app, mockDb as db, mockAuth as auth };

// Add a test
describe('Firebase Mock', () => {
  test('mock objects are defined', () => {
    expect(mockDb).toBeDefined();
    expect(mockAuth).toBeDefined();
    expect(mockApp).toBeDefined();
  });
}); 