# Munch Club (munch-club.vercel.app)

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
