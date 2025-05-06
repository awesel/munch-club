'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { 
    Auth, 
    User, 
    onAuthStateChanged, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Import your initialized auth
import { createOrUpdateUser } from '@/lib/api'; // Import the new function
import Spinner from '@/components/Spinner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
           await createOrUpdateUser(currentUser); // Call on auth change
        } catch (error) {
           console.error("AuthProvider: Failed to update user profile on auth change", error);
           // Optional: Add some user-facing error handling here?
        }
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Check if email is from Stanford
      if (!result.user.email?.endsWith('@stanford.edu')) {
        setError('Please sign in with your Stanford email address.');
        // Sign out the user if not using Stanford email
        await firebaseSignOut(auth);
      }
      
      // onAuthStateChanged above will handle setting user
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      setError("Failed to sign in. Please try again.");
      setLoading(false);
      // Handle specific errors if needed (e.g., popup closed)
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle setting user to null and loading state
    } catch (error) {
      console.error("Error signing out: ", error);
      setError("Failed to sign out. Please try again.");
      setLoading(false);
    }
  };

  // Always render the provider.
  // Consumers will use the 'loading' value to decide what to render.
  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, error }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 