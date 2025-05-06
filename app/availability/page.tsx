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

export default function AvailabilityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date()); // Start with current week
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isRepeating, setIsRepeating] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const monday = useMemo(() => getMonday(currentWeekDate), [currentWeekDate]);
  const weekStartDateKey = useMemo(() => formatDateKey(monday), [monday]);

  const fetchAvailability = useCallback(async () => {
    if (!user) return; // Don't fetch if user isn't loaded
    
    console.log(`Fetching availability for user ${user.uid}`);
    setIsLoading(true);
    setError(null);
    setHasChanges(false);
    try {
      // Try to get repeating availability first
      const data = await getUserAvailability(user.uid, currentWeekDate);
      setAvailability(data?.availability || {}); // Initialize with empty object if null
      
      // We always want to work with repeating availability
      if (!data?.repeating) {
        setIsRepeating(true);
      }
    } catch (err) {
      console.error("Failed to fetch availability:", err);
      setError(err instanceof Error ? err.message : "Could not load availability data.");
      setAvailability({}); // Reset on error
    } finally {
      setIsLoading(false);
    }
  }, [user, currentWeekDate]);

  // Fetch data when user changes
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
    setSuccessMessage(null);
    try {
      // Always save as repeating availability
      await saveUserAvailability(user.uid, currentWeekDate, availability, true);
      setHasChanges(false); // Reset changes state on successful save
      console.log("Availability saved successfully.");
      // Show success message and mention matches are being generated
      setSuccessMessage("Your availability has been saved! We're generating meal matches based on your schedule.");
    } catch (err) {
      console.error("Failed to save availability:", err);
      setError(err instanceof Error ? err.message : "Could not save availability data.");
    } finally {
      setIsSaving(false);
    }
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
          
          {/* Header and Save Button */} 
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-800 dark:text-gray-200 text-center">
                Your Weekly Availability
              </span>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Button 
                size="auto" 
                onClick={handleSaveChanges} 
                disabled={!hasChanges || isLoading || isSaving}
                className="w-full sm:w-auto"
              >
                {isSaving ? <Spinner /> : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Info text */}
          <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md">
            <p className="text-sm">
              <strong>Note:</strong> Set your availability once and we'll use this schedule for all future events and recommendations.
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md">
              <p><strong>Success:</strong> {successMessage}</p>
              <div className="mt-2">
                <Button 
                  size="auto" 
                  onClick={() => router.push('/matches')}
                  className="text-sm"
                >
                  View Matches
                </Button>
              </div>
            </div>
          )}

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