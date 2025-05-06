'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, ArrowRightOnRectangleIcon, UserCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/context/AuthContext';
import Button from './Button';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, showBackButton = false }) => {
  const router = useRouter();
  const { user, loading, signInWithGoogle, signOut, error } = useAuth();

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md p-4 h-16 flex items-center justify-between z-10 max-w-[640px] mx-auto">
        <div className="flex items-center flex-1 min-w-0">
          {showBackButton && (
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ChevronLeftIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate ml-2">
            {title}
          </h1>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {!loading && (
            <>
              {user ? (
                <>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="h-8 w-8 rounded-full" />
                  ) : (
                    <UserCircleIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline truncate">
                    {user.displayName || user.email}
                  </span>
                  <button
                    onClick={signOut}
                    aria-label="Sign out"
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                  </button>
                </>
              ) : (
                <Button onClick={signInWithGoogle} size="auto" variant="secondary" className="h-10 text-sm px-3 py-1">
                  Sign In with Google
                </Button>
              )}
            </>
          )}
        </div>
      </header>

      {error && (
        <div className="fixed top-16 left-0 right-0 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-3 z-10 flex items-center justify-center max-w-[640px] mx-auto">
          <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </>
  );
};

export default Header;
