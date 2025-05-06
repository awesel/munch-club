'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Button from '@/components/Button';
import Spinner from '@/components/Spinner';
import { getUserProfile, UserProfile, getUserAvailability, findPotentialMatches, acceptMatch, declineMatch, Match } from '@/lib/api';
import { UserCircleIcon, CheckIcon, XMarkIcon, PhoneIcon } from '@heroicons/react/24/solid';

export default function MatchesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [processingMatchId, setProcessingMatchId] = useState<string | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [matchedPhoneNumber, setMatchedPhoneNumber] = useState<string | null>(null);
  const [matchedUser, setMatchedUser] = useState<string | null>(null);
  const [matchedLocation, setMatchedLocation] = useState<string | null>(null);
  const [matchedDate, setMatchedDate] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

        // Get potential matches but only if we don't already have matches
        // This prevents regenerating matches every time the page loads
        if (matches.length === 0) {
          const potentialMatches = await findPotentialMatches(user.uid);
          setMatches(potentialMatches);
        }
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
  }, [user, authLoading, router, matches.length]);

  // Function to manually refresh matches
  const refreshMatches = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const potentialMatches = await findPotentialMatches(user.uid);
      setMatches(potentialMatches);
    } catch (err) {
      console.error("Error refreshing matches:", err);
      setError(err instanceof Error ? err.message : "Could not refresh matches. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptMatch = async (matchId: string, matchUserName: string | null, location: string, dateTime: Date) => {
    if (!user) return;
    
    setProcessingMatchId(matchId);
    try {
      const result = await acceptMatch(user.uid, matchId);
      
      if (result.status === 'matched' && result.phoneNumber) {
        // Both users accepted - show the phone number modal
        setMatchedPhoneNumber(result.phoneNumber);
        setMatchedUser(matchUserName || 'your match');
        setMatchedLocation(location);
        setMatchedDate(dateTime.toLocaleDateString() + ' at ' + dateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        setShowPhoneModal(true);
      } else {
        // Show a success message that the match was accepted
        setSuccessMessage('Match received! Waiting for the other person to accept.');
        setShowSuccessMessage(true);
        
        // Update the match status in the UI instead of removing it
        setMatches(prev => prev.map(match => 
          match.id === matchId ? { ...match, status: 'accepted' } : match
        ));
        
        // Hide the success message after 3 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
        
        return;
      }
      
      // Remove matched/completed match from the list
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

  // Helper function to check if the dining hall is a mutual favorite
  const isMutualFavorite = (match: Match) => {
    if (!match.matchUser.surveyData?.favoriteDiningHalls || !currentProfile?.surveyData?.favoriteDiningHalls) {
      return false;
    }
    
    return (
      match.matchUser.surveyData.favoriteDiningHalls.includes(match.suggestedLocation) &&
      currentProfile.surveyData.favoriteDiningHalls.includes(match.suggestedLocation)
    );
  };

  // Get status badge color and text
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          text: 'text-yellow-800 dark:text-yellow-200',
          label: 'New Match'
        };
      case 'accepted':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-800 dark:text-blue-200',
          label: 'You Accepted'
        };
      case 'matched':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-800 dark:text-green-200',
          label: 'Complete'
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-700',
          text: 'text-gray-800 dark:text-gray-200',
          label: status
        };
    }
  };

  // Get priority score color
  const getPriorityScoreColor = (score: number | undefined) => {
    if (score === undefined) return 'bg-gray-200 dark:bg-gray-700';
    if (score < 3) return 'bg-red-100 dark:bg-red-900/30';
    if (score < 6) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-green-100 dark:bg-green-900/30';
  };

  // Render loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <Header title="Meal Matches" showBackButton={true} />
        <Spinner role="status" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header title="Meal Matches" showBackButton={true} />
      <main className="pt-20 px-4 pb-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Suggested Meal Matches
            </h1>
            <Button
              onClick={refreshMatches}
              variant="secondary"
              aria-label="Refresh matches"
              className="text-sm px-3 py-1"
            >
              Refresh Matches
            </Button>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
              <p>{error}</p>
            </div>
          )}

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-6 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md animate-fade-in-out">
              <p>{successMessage}</p>
            </div>
          )}

          {matches.length === 0 && !isLoading && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-4 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No meal matches available right now. 
                Click "Refresh Matches" or update your availability to find more matches!
              </p>
              <Button 
                onClick={() => router.push('/availability')}
                variant="secondary"
              >
                Update Availability
              </Button>
            </div>
          )}
          
          {matches.map(match => {
            const matchDateTime = new Date(match.suggestedTime.seconds * 1000);
            const statusBadge = getStatusBadge(match.status);
            
            return (
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
                      <div className="flex items-center">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mr-2">
                          {match.matchUser.displayName || 'User'}
                        </h3>
                        <span className={`${statusBadge.bg} ${statusBadge.text} text-xs px-2 py-1 rounded-full`}>
                          {statusBadge.label}
                        </span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        {match.matchUser.email?.split('@')[0]}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 items-center">
                    {/* Priority Score Indicator */}
                    {match.priorityScore !== undefined && (
                      <div className="flex flex-col items-center mr-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getPriorityScoreColor(match.priorityScore)}`}>
                          <span className="text-xs font-semibold text-white">{match.priorityScore}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Match</span>
                      </div>
                    )}
                    
                    {match.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleDeclineMatch(match.id)}
                          disabled={processingMatchId === match.id}
                          className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-800/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          aria-label="Decline match"
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                        <button
                          onClick={() => handleAcceptMatch(
                            match.id, 
                            match.matchUser.displayName, 
                            match.suggestedLocation,
                            matchDateTime
                          )}
                          disabled={processingMatchId === match.id}
                          className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-800/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          aria-label="Accept match"
                        >
                          <CheckIcon className="h-6 w-6" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Meal Details</h4>
                  <div className="text-gray-600 dark:text-gray-400 space-y-1">
                    <p><span className="font-medium">Date: </span>{matchDateTime.toLocaleDateString()}</p>
                    <p><span className="font-medium">Time: </span>{matchDateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    <p>
                      <span className="font-medium">Location: </span>
                      {match.suggestedLocation}
                      {isMutualFavorite(match) && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Mutual Favorite
                        </span>
                      )}
                    </p>
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
            );
          })}
        </div>
      </main>

      {/* Phone Number Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full inline-block mb-3">
                <PhoneIcon className="h-8 w-8 text-green-600 dark:text-green-400"/>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Match Complete!</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Both you and {matchedUser} accepted the match. You can text them to coordinate your meetup.
              </p>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg my-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-800 dark:text-gray-200 font-medium">Phone Number:</p>
                <p className="text-lg text-indigo-600 dark:text-indigo-400 font-bold">{matchedPhoneNumber}</p>
              </div>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mt-2 mb-4">
              <p className="text-gray-800 dark:text-gray-200 text-sm mb-1"><span className="font-medium">Location:</span> {matchedLocation}</p>
              <p className="text-gray-800 dark:text-gray-200 text-sm"><span className="font-medium">When:</span> {matchedDate}</p>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm italic mb-4">
                Suggested text: "Hi, it's [your name] from Munch Club! Looking forward to meeting at {matchedLocation} on {matchedDate}!"
              </p>
              <Button onClick={() => setShowPhoneModal(false)}>
                I'll Text Them Soon
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 