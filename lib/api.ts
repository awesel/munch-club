import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  query,
  where,
  orderBy,
  DocumentData,
  QueryDocumentSnapshot,
  FirestoreError,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { User } from "firebase/auth"; // Import User type

// Define the structure of an Event document
export interface EventData {
  id?: string; // Optional: Only present after fetching or adding
  name: string;
  start: Timestamp;
  end: Timestamp;
  capacity: number;
  participants: string[]; // Array of user UIDs
  creator: string; // User UID
}

const eventsCollection = collection(db, "events");

// Helper to convert Firestore doc to EventData
const mapDocToEvent = (doc: QueryDocumentSnapshot<DocumentData>): EventData => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    start: data.start,
    end: data.end,
    capacity: data.capacity,
    participants: data.participants || [],
    creator: data.creator,
  };
};

// Add a new event
export const addEvent = async (eventData: Omit<EventData, 'id' | 'participants'>): Promise<string> => {
  try {
    const docRef = await addDoc(eventsCollection, {
      ...eventData,
      participants: [], // Initialize participants as empty array
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding event: ", error);
    throw new Error("Failed to add event");
  }
};

// Get all events (consider pagination for large datasets)
export const getAllEvents = async (): Promise<EventData[]> => {
  try {
    const q = query(eventsCollection, orderBy("start", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(mapDocToEvent);
  } catch (error) {
    console.error("Error getting events: ", error);
    throw new Error("Failed to fetch events");
  }
};

// Get events within a date range
export const getEventsInRange = async (startTime: Date, endTime: Date): Promise<EventData[]> => {
  try {
    const startTimestamp = Timestamp.fromDate(startTime);
    const endTimestamp = Timestamp.fromDate(endTime);

    const q = query(
      eventsCollection,
      where("start", ">=", startTimestamp),
      where("start", "<=", endTimestamp),
      orderBy("start", "asc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(mapDocToEvent);
  } catch (error) {
    console.error("Error getting events in range: ", error);
    throw new Error("Failed to fetch events for the selected range");
  }
};


// Get a single event by ID
export const getEventById = async (id: string): Promise<EventData | null> => {
  try {
    const docRef = doc(db, "events", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return mapDocToEvent(docSnap as QueryDocumentSnapshot<DocumentData>); // Cast needed because exists() narrows type
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting event by ID: ", error);
    throw new Error("Failed to fetch event details");
  }
};

// Join an event (add user ID to participants)
export const joinEvent = async (eventId: string, userId: string): Promise<void> => {
  try {
    const eventRef = doc(db, "events", eventId);
    // Consider adding a transaction here to check capacity before joining
    await updateDoc(eventRef, {
      participants: arrayUnion(userId),
    });
  } catch (error) {
    console.error("Error joining event: ", error);
    // More specific error handling might be needed (e.g., event full)
    throw new Error("Failed to join event");
  }
};

// Leave an event (remove user ID from participants)
export const leaveEvent = async (eventId: string, userId: string): Promise<void> => {
  try {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      participants: arrayRemove(userId),
    });
  } catch (error) {
    console.error("Error leaving event: ", error);
    throw new Error("Failed to leave event");
  }
};

// --- User Profile --- 

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  friends?: string[]; // Array of friend UIDs
  surveyCompleted?: boolean;
  surveyData?: UserSurveyData;
  photoURL?: string;
}

export interface UserSurveyData {
  mealTalkPreferences: string[];
  conversationStyle: string;
  disagreementTolerance: string;
  conversationPace: string;
  foodPersonality: string;
  companionPetPeeve: string;
}

const usersCollection = collection(db, "users");

// Create or update user profile data in Firestore
// Typically called after login or when auth state changes
export const createOrUpdateUser = async (user: User): Promise<void> => {
  const userRef = doc(db, "users", user.uid);
  const userData: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    // We don't include friends here to avoid overwriting on login
  };
  try {
    // Use setDoc with merge: true to create or update without overwriting existing fields like 'friends'
    await setDoc(userRef, userData, { merge: true });
    console.log("User profile created/updated for:", user.uid);
  } catch (error) {
    console.error("Error creating/updating user profile: ", error);
    // Decide if this error should be surfaced to the user
    throw new Error("Failed to update user profile."); 
  }
};

// Function to get a single user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const userRef = doc(db, "users", userId);
    try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        } else {
            console.log("No profile found for user:", userId);
            return null;
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw new Error("Failed to fetch user profile.");
    }
};

// Get all users (excluding the current user)
export const getAllUsers = async (currentUserId: string): Promise<UserProfile[]> => {
    try {
        // Query to get all users except the current one
        const q = query(usersCollection, where("uid", "!=", currentUserId)); 
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
        console.error("Error getting all users: ", error);
        throw new Error("Failed to fetch user list.");
    }
};

// Add a friend relationship
export const addFriend = async (userId: string, friendId: string): Promise<void> => {
    if (userId === friendId) throw new Error("Cannot add yourself as a friend.");
    const userRef = doc(db, "users", userId);
    try {
        // Add friendId to the current user's friends array
        await updateDoc(userRef, {
            friends: arrayUnion(friendId)
        });
        console.log(`User ${userId} added friend ${friendId}`);
        // Consider also adding userId to friendId's friends list for bi-directional? (More complex rules needed)
    } catch (error) {
        console.error("Error adding friend: ", error);
        throw new Error("Failed to add friend.");
    }
};

// Remove a friend relationship
export const removeFriend = async (userId: string, friendId: string): Promise<void> => {
    const userRef = doc(db, "users", userId);
    try {
        // Remove friendId from the current user's friends array
        await updateDoc(userRef, {
            friends: arrayRemove(friendId)
        });
        console.log(`User ${userId} removed friend ${friendId}`);
        // Consider also removing userId from friendId's friends list
    } catch (error) {
        console.error("Error removing friend: ", error);
        throw new Error("Failed to remove friend.");
    }
};

// Save user survey data
export const saveUserSurvey = async (userId: string, surveyData: UserSurveyData): Promise<void> => {
  const userRef = doc(db, "users", userId);
  try {
    await updateDoc(userRef, {
      surveyData,
      surveyCompleted: true
    });
    console.log("Survey saved for user:", userId);
  } catch (error) {
    console.error("Error saving survey data:", error);
    throw new Error("Failed to save survey data.");
  }
};

// Check if user has completed the survey
export const hasCompletedSurvey = async (userId: string): Promise<boolean> => {
  try {
    const userProfile = await getUserProfile(userId);
    return !!userProfile?.surveyCompleted;
  } catch (error) {
    console.error("Error checking survey completion status:", error);
    throw new Error("Failed to check survey status.");
  }
};

// --- Availability --- 

// Structure for storing availability for a week
export interface WeeklyAvailabilityData {
  // Key: Date string (YYYY-MM-DD) for Monday of the week
  weekStartDate: string; 
  // Key: Date string (YYYY-MM-DD) for a specific day
  // Value: Array of available time slots (e.g., "HH:MM" in 24h format, like "09:00", "14:30")
  availability: Record<string, string[]>;
  userId: string; // Link to the user
}

const availabilityCollection = collection(db, "userAvailability");

// Helper to get Monday of a given date
export const getMonday = (d: Date): Date => {
  d = new Date(d);
  const day = d.getDay(),
      diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday (0)
  return new Date(d.setDate(diff));
};

// Helper to format date as YYYY-MM-DD
export const formatDateKey = (d: Date): string => {
  return d.toISOString().split('T')[0];
};

// Get user availability for a specific week
export const getUserAvailability = async (userId: string, weekDate: Date): Promise<WeeklyAvailabilityData | null> => {
  const monday = getMonday(weekDate);
  const weekKey = formatDateKey(monday);
  const docId = `${userId}_${weekKey}`; // Compound doc ID for easier lookup
  try {
    const docRef = doc(db, "userAvailability", docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      // Basic validation might be good here
      return docSnap.data() as WeeklyAvailabilityData;
    } else {
      return null; // No availability saved for this week
    }
  } catch (error) {
    console.error("Error getting user availability: ", error);
    throw new Error("Failed to fetch availability data.");
  }
};

// Save/update user availability for a specific week
export const saveUserAvailability = async (userId: string, weekDate: Date, availability: Record<string, string[]>): Promise<void> => {
  const monday = getMonday(weekDate);
  const weekKey = formatDateKey(monday);
  const docId = `${userId}_${weekKey}`; // Compound doc ID
  const data: WeeklyAvailabilityData = {
    userId: userId,
    weekStartDate: weekKey,
    availability: availability,
  };
  try {
    const docRef = doc(db, "userAvailability", docId);
    // Use setDoc with merge: true if you want partial updates, 
    // but overwriting the whole week seems simpler for a When2Meet style
    await setDoc(docRef, data); 
  } catch (error) {
    console.error("Error saving user availability: ", error);
    throw new Error("Failed to save availability data.");
  }
};

// --- Matches --- 

export interface Match {
  id: string;
  userId: string;
  matchUserId: string;
  matchUser: UserProfile;
  suggestedTime: Timestamp;
  suggestedLocation: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp;
}

const matchesCollection = collection(db, "matches");
const locationsCollection = collection(db, "locations");

// Function to find potential matches based on availability and preferences
export const findPotentialMatches = async (userId: string): Promise<Match[]> => {
  try {
    // Get the user's availability
    const userAvailability = await getUserAvailability(userId, new Date());
    
    if (!userAvailability || Object.keys(userAvailability.availability).length === 0) {
      return [];
    }

    // Query for existing matches that are still pending
    const q = query(
      matchesCollection,
      where('userId', '==', userId),
      where('status', '==', 'pending')
    );
    
    const matchesSnapshot = await getDocs(q);
    const existingMatches: Match[] = [];
    
    matchesSnapshot.forEach(doc => {
      existingMatches.push({ id: doc.id, ...doc.data() } as Match);
    });
    
    // If there are already pending matches, return those first
    if (existingMatches.length > 0) {
      // Fetch the matched user's profile for each match
      const matchesWithProfiles = await Promise.all(
        existingMatches.map(async match => {
          const matchedUserProfile = await getUserProfile(match.matchUserId);
          return {
            ...match,
            matchUser: matchedUserProfile || {
              uid: match.matchUserId,
              email: null,
              displayName: null
            }
          };
        })
      );
      
      return matchesWithProfiles;
    }
    
    // Find users who have availability that overlaps with the current user
    // This is a simplified version - in a real app, this would be more sophisticated
    const availableDays = Object.keys(userAvailability.availability);
    const matchedUsers: string[] = [];
    const potentialMatches: Match[] = [];
    
    // Get all users with survey completed
    const usersQuery = query(usersCollection, where('surveyCompleted', '==', true));
    const usersSnapshot = await getDocs(usersQuery);
    
    const availableUsers: UserProfile[] = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data() as UserProfile;
      if (userData.uid !== userId) {
        availableUsers.push(userData);
      }
    });
    
    // Get some sample lunch locations
    const locationsSnapshot = await getDocs(locationsCollection);
    const locations: string[] = [];
    locationsSnapshot.forEach(doc => {
      locations.push(doc.data().name);
    });
    
    // If no locations in DB, use these defaults
    const defaultLocations = [
      "Tresidder Union",
      "Coho Cafe",
      "Arbuckle Dining",
      "Bytes Cafe",
      "The Axe & Palm"
    ];
    
    const lunchLocations = locations.length > 0 ? locations : defaultLocations;
    
    // For demo purposes, we'll create matches with random users and times
    // In a real app, you'd use a more sophisticated matching algorithm
    for (const otherUser of availableUsers.slice(0, 3)) { // Limit to 3 matches for demo
      // Check if already in matches
      if (matchedUsers.includes(otherUser.uid)) continue;
      
      matchedUsers.push(otherUser.uid);
      
      // Pick a random available day and time
      const randomDayIndex = Math.floor(Math.random() * availableDays.length);
      const matchDay = availableDays[randomDayIndex];
      
      // Convert the date string to a Date object and set lunch hour (e.g., 12 PM)
      const [year, month, day] = matchDay.split('-').map(Number);
      const matchDate = new Date(year, month - 1, day, 12, 0); // noon
      
      // Pick a random location
      const randomLocationIndex = Math.floor(Math.random() * lunchLocations.length);
      const matchLocation = lunchLocations[randomLocationIndex];
      
      // Create a new match document
      const newMatch: Omit<Match, 'id'> = {
        userId,
        matchUserId: otherUser.uid,
        matchUser: otherUser,
        suggestedTime: Timestamp.fromDate(matchDate),
        suggestedLocation: matchLocation,
        status: 'pending',
        createdAt: Timestamp.now()
      };
      
      // Save the match to Firestore
      const matchRef = await addDoc(matchesCollection, newMatch);
      
      potentialMatches.push({
        id: matchRef.id,
        ...newMatch
      });
    }
    
    return potentialMatches;
    
  } catch (error) {
    console.error("Error finding potential matches:", error);
    throw new Error("Failed to find lunch matches.");
  }
};

// Accept a match
export const acceptMatch = async (userId: string, matchId: string): Promise<void> => {
  try {
    const matchRef = doc(db, "matches", matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) {
      throw new Error("Match not found");
    }
    
    const matchData = matchDoc.data();
    
    // Verify this match belongs to the user
    if (matchData.userId !== userId) {
      throw new Error("You don't have permission to accept this match");
    }
    
    // Update match status
    await updateDoc(matchRef, {
      status: 'accepted'
    });
    
    // In a real app, we would also:
    // 1. Create a confirmed lunch event
    // 2. Send notifications to both users
    // 3. Update the UI to show confirmed lunches
    
  } catch (error) {
    console.error("Error accepting match:", error);
    throw new Error("Failed to accept lunch match.");
  }
};

// Decline a match
export const declineMatch = async (userId: string, matchId: string): Promise<void> => {
  try {
    const matchRef = doc(db, "matches", matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) {
      throw new Error("Match not found");
    }
    
    const matchData = matchDoc.data();
    
    // Verify this match belongs to the user
    if (matchData.userId !== userId) {
      throw new Error("You don't have permission to decline this match");
    }
    
    // Update match status
    await updateDoc(matchRef, {
      status: 'declined'
    });
    
  } catch (error) {
    console.error("Error declining match:", error);
    throw new Error("Failed to decline lunch match.");
  }
};
