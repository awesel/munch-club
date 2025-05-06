'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Button from '@/components/Button';
import Spinner from '@/components/Spinner';
import {
  getAllUsers,
  addFriend,
  removeFriend,
  getUserProfile,
  UserProfile
} from '@/lib/api';
import { UserCircleIcon, UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/solid';

export default function FriendsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutatingFriendId, setMutatingFriendId] = useState<string | null>(null); // Track which user's button is loading

  const fetchInitialData = useCallback(async () => {
    if (!user) return;

    setIsLoadingUsers(true);
    setIsLoadingProfile(true);
    setError(null);

    try {
      // Fetch profile first to know current friends
      const profile = await getUserProfile(user.uid);
      setCurrentUserProfile(profile);
      setIsLoadingProfile(false);

      // Then fetch all other users
      const users = await getAllUsers(user.uid);
      setAllUsers(users);
      setIsLoadingUsers(false);

    } catch (err) {
      console.error("Failed to fetch friends page data:", err);
      setError(err instanceof Error ? err.message : "Could not load user or profile data.");
      setIsLoadingUsers(false);
      setIsLoadingProfile(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
    if (!authLoading && !user) {
      // Reset state if user logs out
      setAllUsers([]);
      setCurrentUserProfile(null);
      setIsLoadingUsers(false);
      setIsLoadingProfile(false);
      setError(null);
    }
  }, [user, authLoading, fetchInitialData]);

   // Redirect if not logged in (after auth check)
   useEffect(() => {
    if (!authLoading && !user) {
      router.push('/'); 
    }
  }, [user, authLoading, router]);

  const handleAddFriend = async (friendId: string) => {
    if (!user || !friendId) return;
    setMutatingFriendId(friendId);
    setError(null);
    try {
      await addFriend(user.uid, friendId);
      // Refresh current user's profile to update friend list
      const updatedProfile = await getUserProfile(user.uid);
      setCurrentUserProfile(updatedProfile);
    } catch (err) {
      console.error("Error adding friend:", err);
      setError(err instanceof Error ? err.message : "Failed to add friend.");
    } finally {
      setMutatingFriendId(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!user || !friendId) return;
    setMutatingFriendId(friendId);
    setError(null);
    try {
      await removeFriend(user.uid, friendId);
      // Refresh current user's profile
      const updatedProfile = await getUserProfile(user.uid);
      setCurrentUserProfile(updatedProfile);
    } catch (err) {
      console.error("Error removing friend:", err);
      setError(err instanceof Error ? err.message : "Failed to remove friend.");
    } finally {
      setMutatingFriendId(null);
    }
  };

  const isLoading = authLoading || isLoadingUsers || isLoadingProfile;
  const friendsList = currentUserProfile?.friends || [];

  if (isLoading && !error) {
     return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <Header title="Manage Friends" showBackButton={true} />
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header title="Manage Friends" showBackButton={true} />
      <main className="pt-20 px-4 pb-4">
        <div className="max-w-[640px] mx-auto">
          <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">All Users</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}

          {isLoadingUsers && !error ? (
             <div className="flex justify-center items-center h-40"><Spinner /></div>
          ) : allUsers.length === 0 && !error ? (
            <p className="text-center text-gray-500 dark:text-gray-400">No other users found.</p>
          ) : (
            <ul className="space-y-3">
              {allUsers.map((otherUser) => {
                const isFriend = friendsList.includes(otherUser.uid);
                const isButtonLoading = mutatingFriendId === otherUser.uid;
                return (
                  <li key={otherUser.uid} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {otherUser.displayName || '-'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {otherUser.email || 'No email'}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {isFriend ? (
                        <Button 
                          size="auto" 
                          variant="secondary" 
                          onClick={() => handleRemoveFriend(otherUser.uid)}
                          disabled={isButtonLoading}
                          className="h-9 px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                          aria-label={`Remove friend ${otherUser.displayName || otherUser.email}`}
                        >
                          {isButtonLoading ? <Spinner/> : <UserMinusIcon className="h-5 w-5 mr-1 inline-block"/>}
                          Remove
                        </Button>
                      ) : (
                        <Button 
                          size="auto" 
                          variant="secondary"
                          onClick={() => handleAddFriend(otherUser.uid)}
                          disabled={isButtonLoading}
                          className="h-9 px-3 py-1 text-sm"
                          aria-label={`Add friend ${otherUser.displayName || otherUser.email}`}
                        >
                           {isButtonLoading ? <Spinner/> : <UserPlusIcon className="h-5 w-5 mr-1 inline-block"/>}
                          Add
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
