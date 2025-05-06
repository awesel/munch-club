'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import AvailabilityGrid from '@/components/AvailabilityGrid';
import Button from '@/components/Button';
import Spinner from '@/components/Spinner';
import {
  getUserAvailability,
  saveUserAvailability,
  WeeklyAvailabilityData,
  getMonday,
  formatDateKey
} from '@/lib/api';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

export default function AvailabilityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date()); // Start with current week
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const monday = useMemo(() => getMonday(currentWeekDate), [currentWeekDate]);
  const weekStartDateKey = useMemo(() => formatDateKey(monday), [monday]);

  const fetchAvailability = useCallback(async () => {
    if (!user) return; // Don't fetch if user isn't loaded
    
    console.log(`Fetching availability for user ${user.uid} and week starting ${weekStartDateKey}`);
    setIsLoading(true);
    setError(null);
    setHasChanges(false);
    try {
      const data = await getUserAvailability(user.uid, currentWeekDate);
      setAvailability(data?.availability || {}); // Initialize with empty object if null
    } catch (err) {
      console.error("Failed to fetch availability:", err);
      setError(err instanceof Error ? err.message : "Could not load availability data.");
      setAvailability({}); // Reset on error
    } finally {
      setIsLoading(false);
    }
  }, [user, currentWeekDate, weekStartDateKey]);

  // Fetch data when user or week changes
  useEffect(() => {
    if (!authLoading && user) {
      fetchAvailability();
    }
    if (!authLoading && !user) {
      // If user logs out or isn't logged in, reset state
      setAvailability({});
      setIsLoading(false); 
      setError(null);
    }
  }, [user, authLoading, fetchAvailability]);

  // Redirect if not logged in (after auth check)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/'); // Or a dedicated login page
    }
  }, [user, authLoading, router]);

  const handleAvailabilityChange = (newAvailability: Record<string, string[]>) => {
    setAvailability(newAvailability);
    setHasChanges(true); // Mark changes when grid notifies
  };

  const handleSaveChanges = async () => {
    if (!user || !hasChanges) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveUserAvailability(user.uid, currentWeekDate, availability);
      setHasChanges(false); // Reset changes state on successful save
      console.log("Availability saved successfully.");
      // Optionally show a success message
    } catch (err) {
      console.error("Failed to save availability:", err);
      setError(err instanceof Error ? err.message : "Could not save availability data.");
    } finally {
      setIsSaving(false);
    }
  };

  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeekDate);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentWeekDate(prevWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeekDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentWeekDate(nextWeek);
  };

  // Render loading state or login prompt
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <Header title="Availability" showBackButton={true} />
        <Spinner />
      </div>
    );
  }
  if (!user) {
     // This should ideally be handled by the redirect, but provides a fallback UI
     return (
       <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
         <Header title="Availability" showBackButton={true} />
         <main className="pt-20 px-4 pb-4 text-center">
           <p className="text-gray-600 dark:text-gray-400">Please sign in to view or edit your availability.</p>
           {/* Optional: Add sign-in button here too? */}
         </main>
       </div>
     );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header title="Your Availability" showBackButton={true} />
      <main className="pt-20 px-4 pb-4">
        <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
          
          {/* Week Navigation and Save Button */} 
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={goToPreviousWeek} 
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous week"
                disabled={isLoading || isSaving}
              >
                <ChevronLeftIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </button>
              <span className="text-lg font-semibold text-gray-800 dark:text-gray-200 text-center">
                Week of {monday.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <button 
                onClick={goToNextWeek} 
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next week"
                disabled={isLoading || isSaving}
              >
                <ChevronRightIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <Button 
              size="auto" 
              onClick={handleSaveChanges} 
              disabled={!hasChanges || isLoading || isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? <Spinner /> : 'Save Changes'}
            </Button>
          </div>

          {/* Error Display */} 
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}

          {/* Loading or Grid Display */} 
          {isLoading ? (
            <div className="flex justify-center items-center h-60">
              <Spinner />
            </div>
          ) : (
            <AvailabilityGrid 
              initialAvailability={availability} 
              weekDate={currentWeekDate} 
              onAvailabilityChange={handleAvailabilityChange} 
              isSaving={isSaving}
            />
          )}

        </div>
      </main>
    </div>
  );
}
