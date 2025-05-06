'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Button from '@/components/Button';
import Spinner from '@/components/Spinner';
import { getUserProfile, UserProfile, getUserAvailability, findPotentialMatches, acceptMatch, declineMatch, Match } from '@/lib/api';
import { UserCircleIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

export default function MatchesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [processingMatchId, setProcessingMatchId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        // Get user profile to check if survey is completed
        const profile = await getUserProfile(user.uid);
        setCurrentProfile(profile);

        if (!profile?.surveyCompleted) {
          // Redirect to survey if not completed
          router.push('/survey');
          return;
        }

        // Get potential matches
        const potentialMatches = await findPotentialMatches(user.uid);
        setMatches(potentialMatches);
      } catch (err) {
        console.error("Error fetching matches:", err);
        setError(err instanceof Error ? err.message : "Could not load matches. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchMatches();
    } else if (!authLoading && !user) {
      // Redirect to home if not logged in
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleAcceptMatch = async (matchId: string) => {
    if (!user) return;
    
    setProcessingMatchId(matchId);
    try {
      await acceptMatch(user.uid, matchId);
      // Remove from list or update UI
      setMatches(prev => prev.filter(match => match.id !== matchId));
    } catch (err) {
      console.error("Error accepting match:", err);
      setError(err instanceof Error ? err.message : "Failed to accept match. Please try again.");
    } finally {
      setProcessingMatchId(null);
    }
  };

  const handleDeclineMatch = async (matchId: string) => {
    if (!user) return;
    
    setProcessingMatchId(matchId);
    try {
      await declineMatch(user.uid, matchId);
      // Remove from list
      setMatches(prev => prev.filter(match => match.id !== matchId));
    } catch (err) {
      console.error("Error declining match:", err);
      setError(err instanceof Error ? err.message : "Failed to decline match. Please try again.");
    } finally {
      setProcessingMatchId(null);
    }
  };

  // Render loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <Header title="Lunch Matches" showBackButton={true} />
        <Spinner role="status" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header title="Lunch Matches" showBackButton={true} />
      <main className="pt-20 px-4 pb-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Your Suggested Lunch Matches
          </h1>
          
          {error && (
            <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
              <p>{error}</p>
            </div>
          )}

          {matches.length === 0 && !isLoading && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-4 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No lunch matches available right now. 
                Check back later or update your availability to find more matches!
              </p>
              <Button 
                onClick={() => router.push('/availability')}
                variant="secondary"
              >
                Update Availability
              </Button>
            </div>
          )}
          
          {matches.map(match => (
            <div key={match.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  {match.matchUser.photoURL ? (
                    <img 
                      src={match.matchUser.photoURL} 
                      alt={match.matchUser.displayName || 'User'} 
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <UserCircleIcon className="h-12 w-12 text-gray-500 dark:text-gray-400" />
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {match.matchUser.displayName || 'User'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {match.matchUser.email?.split('@')[0]}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDeclineMatch(match.id)}
                    disabled={processingMatchId === match.id}
                    className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-800/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    aria-label="Decline match"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => handleAcceptMatch(match.id)}
                    disabled={processingMatchId === match.id}
                    className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-800/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    aria-label="Accept match"
                  >
                    <CheckIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Lunch Details</h4>
                <div className="text-gray-600 dark:text-gray-400 space-y-1">
                  <p><span className="font-medium">Date: </span>{new Date(match.suggestedTime.seconds * 1000).toLocaleDateString()}</p>
                  <p><span className="font-medium">Time: </span>{new Date(match.suggestedTime.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  <p><span className="font-medium">Location: </span>{match.suggestedLocation}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">About {match.matchUser.displayName?.split(' ')[0] || 'Them'}</h4>
                {match.matchUser.surveyData && (
                  <div className="text-gray-600 dark:text-gray-400 space-y-1">
                    <p><span className="font-medium">Conversation style: </span>{match.matchUser.surveyData.conversationStyle}</p>
                    <p><span className="font-medium">Food personality: </span>{match.matchUser.surveyData.foodPersonality}</p>
                    <p>
                      <span className="font-medium">Talk preferences: </span>
                      {match.matchUser.surveyData.mealTalkPreferences.slice(0, 2).join(', ')}
                      {match.matchUser.surveyData.mealTalkPreferences.length > 2 ? '...' : ''}
                    </p>
                  </div>
                )}
              </div>
              
              {processingMatchId === match.id && (
                <div className="mt-4 text-center">
                  <Spinner size="sm" />
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
} 