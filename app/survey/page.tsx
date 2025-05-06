'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Button from '@/components/Button';
import Spinner from '@/components/Spinner';
import { saveUserSurvey, hasCompletedSurvey, getUserProfile, UserSurveyData } from '@/lib/api';

// Survey questions and options
const surveyQuestions = [
  {
    id: 'mealTalkPreferences',
    question: 'What do you enjoy talking about over a meal?',
    description: 'Select all that apply:',
    type: 'checkbox',
    options: [
      'Deep philosophical questions',
      'Personal life and emotions',
      'News, tech, or politics',
      'Jokes and light banter',
      'Movies, books, or pop culture',
      'I prefer mostly eating in silence'
    ]
  },
  {
    id: 'conversationStyle',
    question: 'How do you usually approach conversation with someone new?',
    type: 'radio',
    options: [
      'I dive right in with personal questions',
      'I follow their lead and keep it light',
      'I crack jokes to break the ice',
      'I mostly listen unless something interests me',
      'I\'m quiet unless I really know the person'
    ]
  },
  {
    id: 'disagreementTolerance',
    question: 'What\'s your tolerance for disagreement or debate at the table?',
    type: 'radio',
    options: [
      'Love it — challenge me',
      'Fine with respectful disagreement',
      'Prefer to avoid it while eating',
      'Strong opinions stress me out'
    ]
  },
  {
    id: 'conversationPace',
    question: 'What kind of pace do you like in a meal conversation?',
    type: 'radio',
    options: [
      'Fast, energetic, bouncing between topics',
      'Chill and meandering',
      'Thoughtful and slow',
      'Minimal — let the food speak'
    ]
  },
  {
    id: 'foodPersonality',
    question: 'What\'s your food personality?',
    type: 'radio',
    options: [
      'Adventurous, I\'ll try anything',
      'I like my favorites and stick to them',
      'I\'m picky but polite',
      'Food doesn\'t matter — I\'m here for the company'
    ]
  },
  {
    id: 'companionPetPeeve',
    question: 'Pick the worst thing a meal companion can do:',
    type: 'radio',
    options: [
      'Dominate the conversation',
      'Be on their phone the whole time',
      'Make everything a joke',
      'Get too serious too fast',
      'Criticize what I eat or say'
    ]
  },
  {
    id: 'favoriteDiningHalls',
    question: 'What are your favorite Stanford dining halls?',
    description: 'Select all that apply:',
    type: 'checkbox',
    options: [
      'Arrillaga Family Dining Commons',
      'Stern Dining',
      'Wilbur Dining',
      'Lakeside Dining',
      'Florence Moore (FloMo)',
      'Gerhard Casper Dining Commons',
      'Ricker Dining',
      'Branner Dining'
    ]
  },
  {
    id: 'phoneNumber',
    question: 'What\'s your phone number?',
    description: 'We\'ll use this to notify you about matches. Numbers only, no spaces or special characters.',
    type: 'text'
  }
];

export default function Survey() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonStanfordEmail, setNonStanfordEmail] = useState(false);
  const [isUpdatingExistingSurvey, setIsUpdatingExistingSurvey] = useState(false);

  // Initialize survey responses
  const [surveyResponses, setSurveyResponses] = useState<{
    [key: string]: string | string[];
  }>({
    mealTalkPreferences: [],
    conversationStyle: '',
    disagreementTolerance: '',
    conversationPace: '',
    foodPersonality: '',
    companionPetPeeve: '',
    favoriteDiningHalls: [],
    phoneNumber: ''
  });

  // Check if user has already completed the survey and load their responses
  useEffect(() => {
    const checkSurveyAndLoadData = async () => {
      if (!user) return;
      
      try {
        // Check if email is from Stanford
        if (user.email && !user.email.endsWith('@stanford.edu')) {
          setNonStanfordEmail(true);
          setIsLoading(false);
          return;
        }
        
        const completed = await hasCompletedSurvey(user.uid);
        if (completed) {
          // Get existing survey data
          const userProfile = await getUserProfile(user.uid);
          if (userProfile?.surveyData) {
            // Populate the form with existing data
            setSurveyResponses(prev => ({
              ...prev,
              ...userProfile.surveyData
            }));
            setIsUpdatingExistingSurvey(true);
          }
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error checking survey status:", err);
        setError("Could not check your survey status. Please try again.");
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      checkSurveyAndLoadData();
    } else if (!authLoading && !user) {
      // Redirect to home if not logged in
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleCheckboxChange = (questionId: string, value: string) => {
    setSurveyResponses(prev => {
      const currentSelections = [...(prev[questionId] as string[])];
      const index = currentSelections.indexOf(value);
      
      if (index === -1) {
        // Add the option if not already selected
        return { ...prev, [questionId]: [...currentSelections, value] };
      } else {
        // Remove the option if already selected
        currentSelections.splice(index, 1);
        return { ...prev, [questionId]: currentSelections };
      }
    });
  };

  const handleRadioChange = (questionId: string, value: string) => {
    setSurveyResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleTextChange = (questionId: string, value: string) => {
    // For phoneNumber, only allow digits
    if (questionId === 'phoneNumber') {
      // Remove any non-digit characters
      const digitsOnly = value.replace(/\D/g, '');
      setSurveyResponses(prev => ({
        ...prev,
        [questionId]: digitsOnly
      }));
    } else {
      setSurveyResponses(prev => ({
        ...prev,
        [questionId]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate responses
    let isValid = true;
    const errors: string[] = [];
    
    if ((surveyResponses.mealTalkPreferences as string[]).length === 0) {
      isValid = false;
      errors.push("Please select at least one topic you enjoy talking about.");
    }

    if ((surveyResponses.favoriteDiningHalls as string[]).length === 0) {
      isValid = false;
      errors.push("Please select at least one favorite dining hall.");
    }
    
    if (!surveyResponses.phoneNumber) {
      isValid = false;
      errors.push("Please enter your phone number.");
    } else if ((surveyResponses.phoneNumber as string).length < 10) {
      isValid = false;
      errors.push("Please enter a valid phone number with at least 10 digits.");
    }
    
    for (const question of surveyQuestions) {
      if (question.type === 'radio' && !surveyResponses[question.id]) {
        isValid = false;
        errors.push(`Please answer the question: ${question.question}`);
      }
    }
    
    if (!isValid) {
      setError(errors.join(" "));
      return;
    }
    
    if (!user) {
      setError("You must be logged in to submit the survey.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const surveyData: UserSurveyData = {
        mealTalkPreferences: surveyResponses.mealTalkPreferences as string[],
        conversationStyle: surveyResponses.conversationStyle as string,
        disagreementTolerance: surveyResponses.disagreementTolerance as string,
        conversationPace: surveyResponses.conversationPace as string,
        foodPersonality: surveyResponses.foodPersonality as string,
        companionPetPeeve: surveyResponses.companionPetPeeve as string,
        favoriteDiningHalls: surveyResponses.favoriteDiningHalls as string[],
        phoneNumber: surveyResponses.phoneNumber as string
      };
      
      await saveUserSurvey(user.uid, surveyData);
      
      // Redirect to home page instead of availability
      router.push('/');
    } catch (err) {
      console.error("Error submitting survey:", err);
      setError(err instanceof Error ? err.message : "Failed to submit your survey. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Render loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <Header title="Preferences Survey" showBackButton={false} />
        <Spinner role="status" />
      </div>
    );
  }

  // Render non-Stanford email warning
  if (nonStanfordEmail) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Header title="Preferences Survey" showBackButton={false} />
        <main className="pt-20 px-4 pb-4">
          <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Stanford Email Required</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Sorry, only Stanford emails are allowed to use this application.
            </p>
            <Button onClick={() => router.push('/')} variant="secondary">
              Return to Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header title="Preferences Survey" showBackButton={false} />
      <main className="pt-20 px-4 pb-12">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Tell us about your meal preferences
          </h1>
          
          {error && (
            <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {surveyQuestions.map((question, index) => (
              <div key={question.id} className="py-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {index + 1}. {question.question}
                </h2>
                
                {question.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{question.description}</p>
                )}
                
                <div className="space-y-2 mt-3">
                  {question.type === 'text' ? (
                    <input
                      type="text"
                      id={question.id}
                      name={question.id}
                      value={surveyResponses[question.id] as string}
                      onChange={(e) => handleTextChange(question.id, e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  ) : (
                    question.options?.map(option => (
                      <div key={option} className="flex items-start">
                        {question.type === 'checkbox' ? (
                          <input
                            type="checkbox"
                            id={`${question.id}-${option}`}
                            name={question.id}
                            value={option}
                            checked={(surveyResponses[question.id] as string[]).includes(option)}
                            onChange={() => handleCheckboxChange(question.id, option)}
                            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        ) : (
                          <input
                            type="radio"
                            id={`${question.id}-${option}`}
                            name={question.id}
                            value={option}
                            checked={surveyResponses[question.id] === option}
                            onChange={() => handleRadioChange(question.id, option)}
                            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                        )}
                        <label
                          htmlFor={`${question.id}-${option}`}
                          className="ml-3 block text-gray-700 dark:text-gray-300"
                        >
                          {option}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
            
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? <Spinner size="sm" /> : 'Submit & Continue'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 