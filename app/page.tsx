'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/Spinner';
import { getUserProfile, UserProfile, findPotentialMatches, acceptMatch, declineMatch, Match, hasCompletedSurvey } from '@/lib/api';
import { UserCircleIcon, CheckIcon, XMarkIcon, PhoneIcon } from '@heroicons/react/24/solid';

export default function DashboardPage() {
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
    const checkUserStatusAndFetchMatches = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // First, check if user is using a Stanford email
        if (user.email && !user.email.endsWith('@stanford.edu')) {
          setIsLoading(false);
          return;
        }

        // Next, check if user has completed the survey
        const surveyCompleted = await hasCompletedSurvey(user.uid);
        if (!surveyCompleted) {
          // If survey is not completed, redirect to survey
          router.push('/survey');
          return;
        }
        
        // Get user profile
        const profile = await getUserProfile(user.uid);
        setCurrentProfile(profile);

        // Get potential matches - REMOVED AUTOMATIC FETCH
        // if (matches.length === 0) {
        //   const potentialMatches = await findPotentialMatches(user.uid);
        //   setMatches(potentialMatches);
        // }

      } catch (err) {
        console.error("Error checking user status or fetching matches:", err);
        setError(err instanceof Error ? err.message : "Could not load dashboard. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      checkUserStatusAndFetchMatches();
    }
  }, [user, authLoading, router]); // Removed matches.length from dependencies

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
  const getStatusBadge = (status: Match['status']) => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          text: 'text-yellow-800 dark:text-yellow-200',
          label: 'New Match'
        };
      case 'declined':
        return {
          bg: 'bg-red-100 dark:bg-red-700/30',
          text: 'text-red-700 dark:text-red-200',
          label: 'Declined'
        };
      case 'accepted':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-800 dark:text-blue-200',
          label: 'Accepted'
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <Header title="Munch Club" />
        <Spinner role="status" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header title="Munch Club" />
      <main className="pt-16 px-4 pb-8">
        {!user ? (
          <div className="flex flex-col items-center text-center px-4">
            <div className="max-w-2xl">
              {/* Optional: Add a relevant Heroicon here if desired, e.g., UsersIcon or ChatBubbleOvalLeftEllipsisIcon */}
              {/* <UsersIcon className="w-24 h-24 text-indigo-500 mx-auto mb-6" /> */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Hungry for Connection?
              </h1>
              <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 mb-8">
                Welcome to <span className="font-semibold text-indigo-600 dark:text-indigo-400">Munch Club</span>!
                Don't dine alone. We help you connect with fellow Stanford affiliates for shared meals, engaging conversations, and new friendships.
              </p>
              <p className="text-md text-gray-600 dark:text-gray-400">
                Sign in with your Stanford email to discover who's free to munch!
              </p>
              {/* The Sign-in button is in the Header, so no explicit button needed here, 
                  but the text above guides the user. */}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Action Buttons - moved above matches list */}
            <div className="mt-8 w-full space-y-4 mb-8">
              <Button 
                onClick={() => router.push('/availability')}
                aria-label="Set your availability"
              >
                Update Availability
              </Button>
              <Button 
                onClick={() => router.push('/survey')} 
                aria-label="Update preferences"
                variant="secondary"
              >
                Update Preferences
              </Button>
            </div>

            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Your Suggested Meal Matches
              </h1>
              <Button
                onClick={refreshMatches}
                variant="secondary"
                aria-label="Refresh matches"
                className="text-sm px-3 py-1"
                disabled={isLoading} // Disable button while loading
              >
                {isLoading ? <Spinner size="sm" /> : 'Refresh Matches'}
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
              const mutualFavorite = isMutualFavorite(match);

              const currentUserAcceptedThisMatch = !!(user && match.acceptedBy && match.acceptedBy[user.uid]);
              
              let statusKeyForBadge: Match['status'] = match.status;
              let statusText = '';
              let badgeLabel = '';

              if (match.status === 'pending') {
                badgeLabel = 'New Match';
                statusText = 'Awaiting action.';
              } else if (match.status === 'accepted') {
                if (currentUserAcceptedThisMatch) {
                  badgeLabel = 'You Accepted';
                  statusText = `Waiting for ${match.matchUser?.displayName || 'your match'} to respond.`;
                } else {
                  badgeLabel = `${match.matchUser?.displayName || 'Your match'} Accepted`;
                  statusText = `${match.matchUser?.displayName || 'Your match'} has accepted. Please respond.`;
                }
              } else if (match.status === 'matched') {
                badgeLabel = 'Complete';
                statusText = `It's a Match with ${match.matchUser?.displayName || 'your match'}!`;
                // Also, prepare phone number text if available
                const matchedUserPhoneNumber = match.matchUser?.surveyData?.phoneNumber;
                if (matchedUserPhoneNumber) {
                  statusText += ` Contact: ${matchedUserPhoneNumber}`;
                }
              } else if (match.status === 'declined') {
                badgeLabel = 'Declined';
                statusText = 'This match was declined.';
              } else {
                badgeLabel = match.status || 'Unknown';
                statusKeyForBadge = 'pending';
              }
              
              const badgeProps = getStatusBadge(statusKeyForBadge);
              badgeProps.label = badgeLabel;

              // Determine if action buttons should be shown
              const showActionButtons = (match.status === 'pending') || (match.status === 'accepted' && !currentUserAcceptedThisMatch);

              return (
                <div key={match.id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      {match.matchUser.photoURL ? (
                        <img src={match.matchUser.photoURL} alt={match.matchUser.displayName || 'User'} className="w-12 h-12 rounded-full mr-3" />
                      ) : (
                        <UserCircleIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mr-3" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{match.matchUser.displayName || 'Anonymous User'}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {match.suggestedLocation} - {matchDateTime.toLocaleDateString()} at {matchDateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badgeProps.bg} ${badgeProps.text}`}>
                      {badgeProps.label}
                    </span>
                  </div>

                  {/* Priority Score & Mutual Favorite */}
                  <div className="flex items-center justify-between mb-3 text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-600 dark:text-gray-400 mr-1">Match Score:</span>
                      <div className={`w-16 h-2 rounded-full ${getPriorityScoreColor(match.priorityScore)}`}>
                        <div 
                          className={`h-full rounded-full ${getPriorityScoreColor(match.priorityScore)}`}
                          style={{ width: `${(match.priorityScore || 0) * 10}%` }}
                        ></div>
                      </div>
                      <span className="ml-1 text-gray-600 dark:text-gray-400">({match.priorityScore?.toFixed(1) || 'N/A'})</span>
                    </div>
                    {mutualFavorite && (
                      <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                        Mutual Favorite Dining Hall!
                      </span>
                    )}
                  </div>

                  {match.matchUser.surveyData && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                      <p><span className="font-medium">Conversation style: </span>{match.matchUser.surveyData.conversationStyle}</p>
                      <p><span className="font-medium">Food personality: </span>{match.matchUser.surveyData.foodPersonality}</p>
                    </div>
                  )}

                  {statusText && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-3 whitespace-pre-wrap">{statusText}</p>
                  )}

                  {(showActionButtons) && (
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => handleAcceptMatch(match.id, match.matchUser.displayName, match.suggestedLocation, matchDateTime)}
                        disabled={processingMatchId === match.id}
                        size="auto"
                        className="flex-1"
                      >
                        {processingMatchId === match.id ? <Spinner size="sm" /> : <CheckIcon className="w-4 h-4 mr-1" />} Accept
                      </Button>
                      <Button
                        onClick={() => handleDeclineMatch(match.id)}
                        disabled={processingMatchId === match.id}
                        variant="secondary"
                        size="auto"
                        className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                      >
                        {processingMatchId === match.id ? <Spinner size="sm" /> : <XMarkIcon className="w-4 h-4 mr-1" />} Decline
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Phone Number Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm mx-auto">
            <div className="text-center">
              <PhoneIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">It's a Match!</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                You and {matchedUser} both accepted the invitation to eat at {matchedLocation} on {matchedDate}.
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Contact them at: <strong className="text-gray-900 dark:text-white">{matchedPhoneNumber}</strong>
              </p>
              <div className="mt-4">
                <Button onClick={() => setShowPhoneModal(false)}>
                  Got it!
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
