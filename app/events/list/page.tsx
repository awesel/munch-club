'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import EventCard from '@/components/EventCard';
import Spinner from '@/components/Spinner';
import {
  getAllEvents, 
  getEventsInRange, 
  EventData, 
  getUserAvailability,
  getMonday, 
  WeeklyAvailabilityData,
  formatDateKey
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// Helper to format Date to date input string
const formatDateToDateInput = (date: Date | null): string => {
  if (!date) return '';
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

// Helper to check if an event overlaps with user's availability
const isUserAvailableForEvent = (
  event: EventData,
  availabilityData: WeeklyAvailabilityData | null
): boolean => {
  if (!availabilityData || !event.start || !event.end) return false;

  const eventStartDate = event.start.toDate();
  const eventEndDate = event.end.toDate();
  const eventDateKey = formatDateKey(eventStartDate); // Assume event is on a single day for simplicity

  const availableSlots = availabilityData.availability[eventDateKey];
  if (!availableSlots || availableSlots.length === 0) return false;

  // Check if any time slot within the event duration matches an available slot
  let currentTime = new Date(eventStartDate);
  
  // Round start time down to the nearest 30-min slot for comparison
  const startMinutes = currentTime.getMinutes();
  if (startMinutes >= 30) {
      currentTime.setMinutes(30, 0, 0);
  } else {
      currentTime.setMinutes(0, 0, 0);
  }

  while (currentTime < eventEndDate) {
    const slotHour = currentTime.getHours().toString().padStart(2, '0');
    const slotMinute = currentTime.getMinutes().toString().padStart(2, '0');
    const timeSlotKey = `${slotHour}:${slotMinute}`;

    if (availableSlots.includes(timeSlotKey)) {
      return true; // Found an overlapping available slot
    }

    currentTime.setMinutes(currentTime.getMinutes() + 30); // Move to next 30-min slot
  }

  return false; // No overlap found
};

export default function ListEventsPage() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [userAvailability, setUserAvailability] = useState<WeeklyAvailabilityData | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  // Determine the week to check based on filters or current date
  const relevantWeekDate = useMemo(() => {
      return startDate || new Date(); // Use filter start date or today
  }, [startDate]);

  // Fetch user availability for the relevant week
  const fetchAvailabilityForWeek = useCallback(async () => {
      if (!user) return;
      setIsLoadingAvailability(true);
      try {
          const availability = await getUserAvailability(user.uid, relevantWeekDate);
          setUserAvailability(availability);
      } catch (err) {
          console.error("Error fetching availability on list page:", err);
          // Don't block event loading if availability fails, maybe show a warning
      } finally {
          setIsLoadingAvailability(false);
      }
  }, [user, relevantWeekDate]);

  useEffect(() => {
      if (user) {
          fetchAvailabilityForWeek();
      }
  }, [user, fetchAvailabilityForWeek]);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let fetchedEvents;
      if (startDate && endDate) {
        // Ensure end date includes the whole day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        fetchedEvents = await getEventsInRange(startDate, endOfDay);
      } else {
        fetchedEvents = await getAllEvents();
      }
      setEvents(fetchedEvents);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError(err instanceof Error ? err.message : "Failed to load events.");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]); // Re-fetch when fetchEvents changes (due to date range)

  const handleDateChange = (setter: React.Dispatch<React.SetStateAction<Date | null>>) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value) {
         // Set time to start of day to avoid timezone issues with just date
        const [year, month, day] = e.target.value.split('-').map(Number);
        setter(new Date(year, month - 1, day)); 
      } else {
        setter(null);
      }
  };

  const handleFilterApply = () => {
      fetchEvents(); // Manually trigger fetch when filter applied
  };

  const handleFilterClear = () => {
      setStartDate(null);
      setEndDate(null);
      // Fetching will be triggered by useEffect due to state change
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header title="Events List" showBackButton={true} />
      <main className="pt-20 px-4 pb-4">
        <div className="max-w-[640px] mx-auto">
          {/* Basic Date Range Picker */}
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Filter by Date</h2>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <input 
                  type="date" 
                  id="startDate"
                  value={formatDateToDateInput(startDate)}
                  onChange={handleDateChange(setStartDate)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <input 
                  type="date" 
                  id="endDate"
                  value={formatDateToDateInput(endDate)}
                  onChange={handleDateChange(setEndDate)}
                  min={formatDateToDateInput(startDate)} // Prevent end date before start date
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  disabled={!startDate} // Disable if start date is not set
                />
              </div>
              <div className="flex gap-2 mt-4 sm:mt-0">
                 <button 
                    onClick={handleFilterApply} 
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm disabled:opacity-50"
                    disabled={!startDate || !endDate || isLoading}
                  >
                    Apply
                  </button>
                   <button 
                    onClick={handleFilterClear} 
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-sm disabled:opacity-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                    disabled={!startDate && !endDate || isLoading}
                  >
                    Clear
                  </button>
              </div>
            </div>
            {startDate && !endDate && <p className="text-sm text-yellow-600 mt-2">Please select an end date to apply filter.</p>}
          </div>

          {/* Combined Loading State */} 
          {isLoading || (user && isLoadingAvailability) ? ( // Show spinner if loading events OR availability
            <div className="flex justify-center items-center h-40">
              <Spinner />
              {(isLoadingAvailability && !isLoading) && <p className="ml-2 text-sm text-gray-500">Loading availability...</p>} 
            </div>
          ) : error ? (
            <div className="text-center text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-4 rounded-md">
              <p><strong>Error:</strong> {error}</p>
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => {
                // Determine availability for this specific event
                const isAvailable = user ? isUserAvailableForEvent(event, userAvailability) : false;
                return event.id ? (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    isUserAvailable={isAvailable} // Pass availability flag
                  /> 
                ) : null;
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p>No events found{startDate && endDate ? ' for the selected date range' : ''}.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
