// Mock implementation for firebase/firestore
export const getFirestore = jest.fn();
export const collection = jest.fn();
export const addDoc = jest.fn();
export const getDocs = jest.fn();
export const doc = jest.fn((_, __, id?: string) => ({ id }));
export const getDoc = jest.fn();
export const updateDoc = jest.fn();
export const arrayUnion = jest.fn();
export const arrayRemove = jest.fn();
export const Timestamp = {
  now: jest.fn(() => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 })),
  fromDate: jest.fn((date: Date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }))
};
export const query = jest.fn();
export const where = jest.fn();
export const orderBy = jest.fn();
export const writeBatch = jest.fn(() => ({
  update: jest.fn(),
  set: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined)
}));
export const setDoc = jest.fn();
export const increment = jest.fn();

// Helper functions to set mock implementations
export const mockGetDocImplementation = (implementation: any): void => {
  getDoc.mockImplementation(implementation);
};

export const mockAddDocImplementation = (implementation: any): void => {
  addDoc.mockImplementation(implementation);
};

export const mockGetDocsImplementation = (implementation: any): void => {
  getDocs.mockImplementation(implementation);
};

export const mockUpdateDocImplementation = (implementation: any): void => {
  updateDoc.mockImplementation(implementation);
};

// Reset all mocks
export const resetMocks = (): void => {
  getFirestore.mockReset();
  collection.mockReset();
  addDoc.mockReset();
  getDocs.mockReset();
  doc.mockReset();
  getDoc.mockReset();
  updateDoc.mockReset();
  arrayUnion.mockReset();
  arrayRemove.mockReset();
  query.mockReset();
  where.mockReset();
  orderBy.mockReset();
  writeBatch.mockReset();
  setDoc.mockReset();
  increment.mockReset();
}; 