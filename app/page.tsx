'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/Spinner';
import { hasCompletedSurvey } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

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
        
        // If survey is completed, redirect to availability
        router.push('/availability');
      } catch (err) {
        console.error("Error checking user status:", err);
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      checkUserStatus();
    }
  }, [user, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <Header title="Lunch App" />
        <Spinner role="status" />
      </div>
    );
  }

  // Show the main landing page if not logged in
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header title="Lunch App" />
      <main className="flex flex-col items-center justify-center pt-24 px-4">
        <div className="max-w-3xl text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Over Lunch at Stanford
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Meet new people, have great conversations, and enjoy a meal together.
            Sign in with your Stanford email to get started.
          </p>
        </div>

        {!user && (
          <div className="w-full max-w-md space-y-4 flex flex-col items-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              Please sign in with Google using your Stanford email account
            </p>
            {/* Sign-in button is in the header */}
          </div>
        )}

        {user && (
          <div className="w-full max-w-[640px] space-y-4">
            <Button 
              onClick={() => router.push('/availability')}
              aria-label="Set your availability"
            >
              Set Availability
            </Button>

            <Button 
              onClick={() => router.push('/matches')} 
              aria-label="View matches"
              variant="secondary"
            >
              View Matches
            </Button>

            <Button 
              onClick={() => router.push('/survey')} 
              aria-label="Update preferences"
              variant="secondary"
            >
              Update Preferences
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
