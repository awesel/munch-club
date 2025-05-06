'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import Header from '@/components/Header';
import EventForm from '@/components/EventForm';
import { addEvent } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/Spinner';

export default function AddEventPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleFormSubmit = async (formData: { name: string; start: Date; end: Date; capacity: number }) => {
    if (!user) {
      setSubmitError("You must be logged in to create an event.");
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const eventData = {
        ...formData,
        start: Timestamp.fromDate(formData.start),
        end: Timestamp.fromDate(formData.end),
        creator: user.uid,
      };
      
      const newEventId = await addEvent(eventData);
      console.log("Event added with ID:", newEventId);
      router.push(`/events/${newEventId}`);
    } catch (error) {
      console.error("Failed to add event:", error);
      setSubmitError(error instanceof Error ? error.message : "An unknown error occurred during submission.");
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
       <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
         <Header title="Add New Event" showBackButton={true} />
         <Spinner />
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header title="Add New Event" showBackButton={true} />
      <main className="pt-20 px-4 pb-4">
        <div className="max-w-[640px] mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          {submitError && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
              <p><strong>Error:</strong> {submitError}</p>
            </div>
          )}
          <EventForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
        </div>
      </main>
    </div>
  );
}
