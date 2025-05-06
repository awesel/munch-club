'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import CapacityBar from './CapacityBar';
import { EventData } from '@/lib/api'; // Adjust path if needed
import { CheckCircleIcon } from '@heroicons/react/24/solid'; // Icon for availability

interface EventCardProps {
  event: EventData;
  isUserAvailable?: boolean; // Add optional prop
}

// Helper function to format Firestore Timestamps
const formatTimestamp = (timestamp: Timestamp | undefined): string => {
  if (!timestamp) return 'N/A';
  return timestamp.toDate().toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // Use 24-hour format as often seen in datetime-local
  });
};

const EventCard: React.FC<EventCardProps> = ({ event, isUserAvailable = false }) => {
  const router = useRouter();

  if (!event || !event.id) {
    // Handle cases where event or event.id might be missing
    // console.error("Invalid event data passed to EventCard:", event);
    return <div className="p-4 border rounded-lg shadow bg-red-100 text-red-700">Invalid Event Data</div>;
  }

  const handleCardClick = () => {
    router.push(`/events/${event.id}`);
  };

  return (
    <div
      className={`p-4 border rounded-lg shadow bg-white dark:bg-gray-800 hover:shadow-md cursor-pointer transition-shadow duration-150 relative ${isUserAvailable ? 'border-l-4 border-green-500' : 'border-gray-200 dark:border-gray-700'}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick()}
      aria-label={`View details for ${event.name}`}
    >
      {isUserAvailable && (
        <CheckCircleIcon className="absolute top-2 right-2 h-5 w-5 text-green-500" title="You are available during this event" />
      )}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{event.name}</h3>
      <p className="text-sm font-mono text-gray-600 dark:text-gray-400 mt-1">
        {formatTimestamp(event.start)} – {formatTimestamp(event.end)}
      </p>
      <div className="mt-2">
        <CapacityBar filled={event.participants.length} capacity={event.capacity} />
      </div>
    </div>
  );
};

export default EventCard;
