# Munch Club

A platform that connects Stanford students for meal meetups based on their availability and conversation preferences.

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **Deployment**: Vercel

## Features

1. **Authentication**

   - Sign in with Google (@stanford.edu accounts only)
   - Profile creation and management

2. **Preference Survey**

   - Conversation style preferences
   - Meal talk preferences
   - Food personality assessment
   - Companion pet peeves

3. **Availability Setting**

   - Users indicate their availability for meal throughout the week
   - Week-by-week scheduling with time slots

4. **Matching System**
   - Algorithm suggests potential meal partners based on:
     - Overlapping availability
     - Compatible conversation preferences
     - Similar interests
   - Double opt-in system requires both parties to accept
   - Users can accept or decline suggested matches
   - When both users accept, the meal is scheduled

## Folder Structure

```
meal-app/
├── app/               # Next.js app router pages
│   ├── availability/  # Availability setting page
│   ├── matches/       # Match display and management
│   └── survey/        # Preference survey
├── components/        # Reusable UI components
├── context/           # React context for state management
├── lib/               # Utility functions and Firebase API
└── styles/            # Global styles and Tailwind config
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Firebase account

### Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env.local` file with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
4. Set up Firebase project with Authentication and Firestore
5. Run the development server: `npm run dev`
6. Visit `http://localhost:3000`

## Deployment

### Deploying to Vercel

1. Push your code to a GitHub repository
2. Create a new project on [Vercel](https://vercel.com)
3. Connect your GitHub repository
4. Add the following environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
5. Deploy the project

## Live Demo

View the live application here: [http://mealmunchclub.com](http://mealmunchclub.com)
