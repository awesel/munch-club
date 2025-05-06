# Munch Club

A platform that connects Stanford students for lunch meetups based on their availability and conversation preferences.

## Tech Stack

- **Frontend**: Next.js 13+ (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Testing**: Jest, React Testing Library

## Features

- Stanford email authentication
- Preference-based matching
- Availability scheduling
- Double opt-in matching system
- Profile viewing with limited information sharing

## User Flow

1. **Authentication**

   - Users sign in using Google OAuth
   - Only Stanford email addresses (@stanford.edu) are allowed

2. **Onboarding Survey**

   - First-time users complete a survey about conversation preferences
   - Questions cover topics like:
     - Conversation topics
     - Communication style
     - Disagreement tolerance
     - Conversation pace
     - Food personality
     - Dealbreakers

3. **Availability Setting**

   - Users indicate their availability for lunch throughout the week
   - Week-by-week scheduling with time slots

4. **Matching System**

   - Algorithm suggests potential lunch partners based on:
     - Overlapping availability
     - Compatible conversation preferences
   - Users see limited profile information:
     - Name
     - Profile picture
     - Selected conversation preferences

5. **Match Confirmation**
   - Double opt-in system requires both parties to accept
   - Users can accept or decline suggested matches
   - When both users accept, the lunch is scheduled

## Folder Structure

```
lunch-app/
├── app/               # Next.js app router pages
│   ├── availability/  # Availability setting page
│   ├── matches/       # Match suggestions page
│   ├── survey/        # Preference survey page
├── components/        # Reusable UI components
├── context/           # React context providers
│   ├── AuthContext.tsx # Authentication provider
├── lib/               # Utility functions
│   ├── api.ts         # API functions for Firestore
│   ├── firebase.ts    # Firebase configuration
├── __tests__/         # Jest test files
```

## Authentication Flow

The application enforces Stanford-only access through multiple layers:

1. **Sign-in Validation**:

   - Authentication happens through Google OAuth
   - Email domain validation in AuthContext.tsx (checks for @stanford.edu)
   - Automatic sign-out for non-Stanford emails

2. **Route Protection**:

   - Protected routes check authentication status before rendering
   - Non-authenticated users are redirected to the home page
   - Users without completed surveys are directed to complete them first

3. **Access Control**:
   - Firestore rules enforce ownership of data
   - Users can only access their own information and matches
   - Security rules prevent unauthorized data modification

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a Firebase project and configure authentication/Firestore
4. Set up environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
5. Run the development server: `npm run dev`
6. Visit `http://localhost:3000`
