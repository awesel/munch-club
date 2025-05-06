'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import Header from '@/components/Header';
import CapacityBar from '@/components/CapacityBar';
import Spinner from '@/components/Spinner';
import Button from '@/components/Button';
import { getEventById, joinEvent, leaveEvent, EventData } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// Helper function to format Firestore Timestamps (same as in EventCard)
const formatTimestamp = (timestamp: Timestamp | undefined): string => {
  if (!timestamp) return 'N/A';
  return timestamp.toDate().toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

// Helper to truncate user IDs for display
const truncateUid = (uid: string, length = 8): string => {
  return uid.length > length ? `${uid.substring(0, length)}...` : uid;
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const eventId = typeof params.id === 'string' ? params.id : null;

  const [event, setEvent] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false); // For Join/Leave actions
  const [error, setError] = useState<string | null>(null);

  const fetchEventDetails = useCallback(async () => {
    if (!eventId) {
      setError("Event ID not found.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedEvent = await getEventById(eventId);
      if (!fetchedEvent) {
        setError("Event not found.");
      } else {
        setEvent(fetchedEvent);
      }
    } catch (err) {
      console.error("Failed to fetch event details:", err);
      setError(err instanceof Error ? err.message : "Failed to load event details.");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  const handleJoin = async () => {
    if (!eventId || !event || isMutating || !user) return;
    setIsMutating(true);
    setError(null);
    try {
      await joinEvent(eventId, user.uid);
      // Re-fetch event data to show updated participants and button state
      await fetchEventDetails(); 
    } catch (err) {
      console.error("Failed to join event:", err);
      setError(err instanceof Error ? err.message : "Could not join the event.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleLeave = async () => {
    if (!eventId || !event || isMutating || !user) return;
    setIsMutating(true);
    setError(null);
    try {
      await leaveEvent(eventId, user.uid);
      // Re-fetch event data
      await fetchEventDetails();
    } catch (err) {
      console.error("Failed to leave event:", err);
      setError(err instanceof Error ? err.message : "Could not leave the event.");
    } finally {
      setIsMutating(false);
    }
  };

  const isUserParticipant = user && event?.participants.includes(user.uid);
  const isEventFull = event ? event.participants.length >= event.capacity : false;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <Header title="Loading Event..." showBackButton={true} />
        <Spinner />
      </div>
    );
  }

  if (error && !event) { // Show error prominently if event failed to load at all
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Header title="Error" showBackButton={true} />
        <main className="pt-20 px-4 pb-4">
          <div className="max-w-[640px] mx-auto bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-6 rounded-lg shadow">
            <p><strong>Error:</strong> {error}</p>
            <Button onClick={() => router.back()} variant="secondary" className="mt-4">Go Back</Button>
          </div>
        </main>
      </div>
    );
  }
  
  if (!event) { // Should ideally be covered by the error case above, but belt-and-suspenders
     return (
       <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Header title="Event Not Found" showBackButton={true} />
         <main className="pt-20 px-4 pb-4 text-center text-gray-500 dark:text-gray-400">
            <p>The requested event could not be found.</p>
             <Button onClick={() => router.push('/')} variant="secondary" className="mt-4">Go Home</Button>
         </main>
      </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header title="Event Details" showBackButton={true} />
      <main className="pt-20 px-4 pb-4">
        <div className="max-w-[640px] mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
          {/* Display general errors from join/leave actions */} 
          {error && (
             <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
               <p><strong>Error:</strong> {error}</p>
             </div>
          )}

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{event.name}</h1>
          <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
            {formatTimestamp(event.start)} – {formatTimestamp(event.end)}
          </p>
          <CapacityBar filled={event.participants.length} capacity={event.capacity} />

          {/* Join/Leave Buttons - Only show if user is logged in */} 
          {user && (
            <>
              {!isUserParticipant && !isEventFull && (
                <Button 
                  onClick={handleJoin} 
                  disabled={isMutating}
                  aria-label={`Join event ${event.name}`}
                >
                  {isMutating ? <Spinner /> : 'Join Event'}
                </Button>
              )}
              {!isUserParticipant && isEventFull && (
                 <p className="text-center text-orange-600 dark:text-orange-400 font-medium bg-orange-100 dark:bg-orange-900/30 p-3 rounded-md">Event is full</p>
              )}
              {isUserParticipant && (
                <Button 
                  onClick={handleLeave} 
                  variant="secondary" 
                  disabled={isMutating}
                  aria-label={`Leave event ${event.name}`}
                >
                  {isMutating ? <Spinner /> : 'Leave Event'}
                </Button>
              )}
            </>
          )}
          {!user && (
            <p className="text-center text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
              Please sign in to join or leave the event.
            </p>
          )}

          {/* Participants List */} 
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Participants ({event.participants.length})</h2>
            {event.participants.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                {event.participants.map((uid) => (
                  <li key={uid} className="font-mono text-sm">
                    {truncateUid(uid)}
                    {user && uid === user.uid && <span className="ml-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">(You)</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No one has joined yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
