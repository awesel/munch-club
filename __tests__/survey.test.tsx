import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Survey from '@/app/survey/page';
import { saveUserSurvey } from '@/lib/api';

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the auth context
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the API functions
jest.mock('@/lib/api', () => ({
  saveUserSurvey: jest.fn(),
}));

describe('Survey Page', () => {
  const mockPush = jest.fn();
  const mockUser = { 
    uid: 'test-user-id',
    email: 'test@stanford.edu',
    displayName: 'Test User',
  };

  beforeEach(() => {
    // Setup mocks
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });
    
    (saveUserSurvey as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders all survey questions', () => {
    render(<Survey />);
    
    // Check for all question headers
    expect(screen.getByText(/What do you enjoy talking about over a meal?/i)).toBeInTheDocument();
    expect(screen.getByText(/How do you usually approach conversation/i)).toBeInTheDocument();
    expect(screen.getByText(/What's your tolerance for disagreement/i)).toBeInTheDocument();
    expect(screen.getByText(/What kind of pace do you like/i)).toBeInTheDocument();
    expect(screen.getByText(/What's your food personality?/i)).toBeInTheDocument();
    expect(screen.getByText(/Pick the worst thing a meal companion can do/i)).toBeInTheDocument();
  });

  test('redirects to availability page on successful submit', async () => {
    render(<Survey />);
    
    // Select answers for each question
    const firstQuestionOption = screen.getByLabelText(/Deep philosophical questions/i);
    fireEvent.click(firstQuestionOption);
    
    fireEvent.click(screen.getByLabelText(/I follow their lead and keep it light/i));
    fireEvent.click(screen.getByLabelText(/Fine with respectful disagreement/i));
    fireEvent.click(screen.getByLabelText(/Chill and meandering/i));
    fireEvent.click(screen.getByLabelText(/Adventurous, I'll try anything/i));
    fireEvent.click(screen.getByLabelText(/Be on their phone the whole time/i));
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(saveUserSurvey).toHaveBeenCalledWith(
        'test-user-id', 
        expect.objectContaining({
          mealTalkPreferences: expect.arrayContaining(['Deep philosophical questions']),
          conversationStyle: 'I follow their lead and keep it light',
          disagreementTolerance: 'Fine with respectful disagreement',
          conversationPace: 'Chill and meandering',
          foodPersonality: 'Adventurous, I\'ll try anything',
          companionPetPeeve: 'Be on their phone the whole time'
        })
      );
      expect(mockPush).toHaveBeenCalledWith('/availability');
    });
  });

  test('redirects non-Stanford users to home page', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { ...mockUser, email: 'user@gmail.com' },
      loading: false,
    });

    render(<Survey />);
    
    await waitFor(() => {
      expect(screen.getByText(/only Stanford emails are allowed/i)).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  test('shows loading state when auth is loading', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    render(<Survey />);
    
    expect(screen.getByRole('status')).toBeInTheDocument(); // Assuming Spinner has role="status"
    expect(screen.queryByText(/What do you enjoy talking about/i)).not.toBeInTheDocument();
  });
}); 