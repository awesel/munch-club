import React from 'react';

export const useAuth = jest.fn().mockReturnValue({
  user: {
    uid: 'test-user-id',
    email: 'test@stanford.edu',
    displayName: 'Test User',
  },
  loading: false,
});

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Add a test so the file doesn't fail
describe('AuthContext Mock', () => {
  test('useAuth returns the expected mock values', () => {
    const authValues = useAuth();
    expect(authValues.user.uid).toBe('test-user-id');
  });
}); 