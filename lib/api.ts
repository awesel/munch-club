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
  writeBatch,
  increment,
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
  favoriteDiningHalls: string[];
  phoneNumber: string;
  friendEmails?: string[];
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
  repeating?: boolean; // Whether this is a repeating weekly schedule
}

const availabilityCollection = collection(db, "userAvailability");
const repeatingAvailabilityDoc = 'repeating'; // Constant for the repeating availability document ID suffix

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
      // If no specific week data found, try to get the repeating schedule
      const repeatingDocId = `${userId}_${repeatingAvailabilityDoc}`;
      const repeatingDocRef = doc(db, "userAvailability", repeatingDocId);
      const repeatingDocSnap = await getDoc(repeatingDocRef);
      
      if (repeatingDocSnap.exists()) {
        // If repeating schedule exists, use it but update the weekStartDate for the current week
        const repeatingData = repeatingDocSnap.data() as WeeklyAvailabilityData;
        return {
          ...repeatingData,
          weekStartDate: weekKey, // Use requested week's date
        };
      }
      
      return null; // No availability saved for this week or repeating
    }
  } catch (error) {
    console.error("Error getting user availability: ", error);
    throw new Error("Failed to fetch availability data.");
  }
};

// Save/update user availability for a specific week
export const saveUserAvailability = async (
  userId: string, 
  weekDate: Date, 
  availability: Record<string, string[]>, 
  isRepeating: boolean = false
): Promise<void> => {
  let docId: string;
  let data: WeeklyAvailabilityData;
  
  if (isRepeating) {
    // For repeating schedule, use special document ID
    docId = `${userId}_${repeatingAvailabilityDoc}`;
    data = {
      userId: userId,
      weekStartDate: 'repeating', // Special value for repeating schedule
      availability: availability,
      repeating: true
    };
  } else {
    // For regular week-specific schedule
    const monday = getMonday(weekDate);
    const weekKey = formatDateKey(monday);
    docId = `${userId}_${weekKey}`;
    data = {
      userId: userId,
      weekStartDate: weekKey,
      availability: availability,
      repeating: false
    };
  }
  
  try {
    const docRef = doc(db, "userAvailability", docId);
    await setDoc(docRef, data);
    
    // After successfully saving availability, trigger the matching process
    // We don't need to await this since we don't need to block the save operation
    // on the completion of the matching process
    // findPotentialMatches(userId).catch(error => {
    //   console.error("Error generating matches after saving availability:", error);
    //   // We don't throw here since the availability was saved successfully
    //   // and we don't want to fail the save operation if matching fails
    // });
  } catch (error) {
    console.error("Error saving user availability: ", error);
    throw new Error("Failed to save availability data.");
  }
};

// --- Priority Score System --- 

// New interface for priority score document
export interface PriorityScore {
  id?: string;
  user1Id: string;
  user2Id: string;
  score: number; // 0-10 scale
  lastUpdated: Timestamp;
}

const priorityScoreCollection = collection(db, "priorityScores");

// Calculate baseline score based on survey agreement
const calculateBaselineScore = (user1: UserProfile, user2: UserProfile): number => {
  if (!user1.surveyData || !user2.surveyData) return 5; // Default middle score
  
  let points = 0;
  let maxPoints = 0;
  
  // Compare meal talk preferences (0-1 points)
  if (user1.surveyData.mealTalkPreferences && user2.surveyData.mealTalkPreferences) {
    const overlappingPreferences = user1.surveyData.mealTalkPreferences.filter(
      pref => user2.surveyData?.mealTalkPreferences.includes(pref)
    );
    const totalPreferences = new Set([
      ...user1.surveyData.mealTalkPreferences,
      ...user2.surveyData.mealTalkPreferences
    ]).size;
    
    if (totalPreferences > 0) {
      points += (overlappingPreferences.length / totalPreferences) * 2;
    }
    maxPoints += 2;
  }
  
  // Compare conversation style (0-2 points)
  if (user1.surveyData.conversationStyle && user2.surveyData.conversationStyle) {
    if (user1.surveyData.conversationStyle === user2.surveyData.conversationStyle) {
      points += 2;
    }
    maxPoints += 2;
  }
  
  // Compare conversation pace (0-2 points)
  if (user1.surveyData.conversationPace && user2.surveyData.conversationPace) {
    if (user1.surveyData.conversationPace === user2.surveyData.conversationPace) {
      points += 2;
    }
    maxPoints += 2;
  }
  
  // Compare favorite dining halls (0-2 points)
  if (user1.surveyData.favoriteDiningHalls && user2.surveyData.favoriteDiningHalls) {
    const overlappingDiningHalls = user1.surveyData.favoriteDiningHalls.filter(
      hall => user2.surveyData?.favoriteDiningHalls.includes(hall)
    );
    
    if (overlappingDiningHalls.length > 0) {
      points += Math.min(2, overlappingDiningHalls.length);
    }
    maxPoints += 2;
  }
  
  // Compare food personality (0-2 points)
  if (user1.surveyData.foodPersonality && user2.surveyData.foodPersonality) {
    if (user1.surveyData.foodPersonality === user2.surveyData.foodPersonality) {
      points += 2;
    }
    maxPoints += 2;
  }
  
  // If not enough data for comparison, return middle score
  if (maxPoints === 0) return 5;
  
  // Calculate final score (0-10 scale)
  const normalizedScore = (points / maxPoints) * 10;
  
  // Return score between 3-7 to start, allowing room for future adjustments
  return Math.max(3, Math.min(7, Math.round(normalizedScore)));
};

// Get priority score between two users
export const getPriorityScore = async (userId1: string, userId2: string): Promise<number> => {
  try {
    // Ensure consistent ordering of user IDs to avoid duplicates
    const [user1Id, user2Id] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
    
    // Check if score already exists
    const q = query(
      priorityScoreCollection,
      where('user1Id', '==', user1Id),
      where('user2Id', '==', user2Id)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Return existing score
      return querySnapshot.docs[0].data().score;
    }
    
    // If no score exists, calculate baseline
    const user1Profile = await getUserProfile(user1Id);
    const user2Profile = await getUserProfile(user2Id);
    
    if (!user1Profile || !user2Profile) return 5; // Default middle score
    
    const baselineScore = calculateBaselineScore(user1Profile, user2Profile);
    
    // Save baseline score
    await addDoc(priorityScoreCollection, {
      user1Id,
      user2Id,
      score: baselineScore,
      lastUpdated: Timestamp.now()
    });
    
    return baselineScore;
  } catch (error) {
    console.error("Error getting priority score:", error);
    return 5; // Default to middle priority if error
  }
};

// Update priority score
export const updatePriorityScore = async (userId1: string, userId2: string, adjustment: number): Promise<void> => {
  try {
    // Ensure consistent ordering of user IDs
    const [user1Id, user2Id] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
    
    // Find existing score document
    const q = query(
      priorityScoreCollection,
      where('user1Id', '==', user1Id),
      where('user2Id', '==', user2Id)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // If no score exists, calculate baseline and then apply adjustment
      const baselineScore = await getPriorityScore(user1Id, user2Id);
      
      // Create new score with adjustment
      await addDoc(priorityScoreCollection, {
        user1Id,
        user2Id,
        score: Math.max(0, Math.min(10, baselineScore + adjustment)),
        lastUpdated: Timestamp.now()
      });
    } else {
      // Update existing score
      const scoreDoc = querySnapshot.docs[0];
      const currentScore = scoreDoc.data().score;
      
      // Ensure score stays within 0-10 range
      const newScore = Math.max(0, Math.min(10, currentScore + adjustment));
      
      await updateDoc(doc(priorityScoreCollection, scoreDoc.id), {
        score: newScore,
        lastUpdated: Timestamp.now()
      });
    }
  } catch (error) {
    console.error("Error updating priority score:", error);
    // Don't throw an error - log it and allow the calling function to continue
    // This prevents priority score updates from blocking critical operations like match acceptance
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
  status: 'pending' | 'accepted' | 'matched' | 'declined';
  createdAt: Timestamp;
  priorityScore?: number; // Add priority score
  acceptedBy?: {
    [userId: string]: {
      timestamp: Timestamp;
      isFirst: boolean;
    }
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: 'match_complete' | 'new_match' | 'received_text';
  content: string;
  relatedUserId?: string;
  relatedMatchId?: string;
  read: boolean;
  createdAt: Timestamp;
}

const matchesCollection = collection(db, "matches");
const locationsCollection = collection(db, "locations");
const notificationsCollection = collection(db, "notifications");

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
    
    // Get some meal locations
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
    
    const mealLocations = locations.length > 0 ? locations : defaultLocations;
    
    // Get current user's profile to access their favorite dining halls
    const currentUserProfile = await getUserProfile(userId);
    const userFavoriteDiningHalls = currentUserProfile?.surveyData?.favoriteDiningHalls || [];
    
    // First check priority scores for all users
    const usersWithPriorityScores = await Promise.all(
      availableUsers.map(async (user) => {
        // Get priority score between users (uses baseline if none exists)
        const priorityScore = await getPriorityScore(userId, user.uid);
        
        // Skip users with priority score of 0 (incompatible)
        if (priorityScore === 0) {
          return null;
        }
        
        // If user has no survey data, assume no overlap
        if (!user.surveyData?.favoriteDiningHalls) {
          return { user, overlap: 0, diningHalls: [], priorityScore };
        }
        
        // Find overlapping dining halls
        const otherUserDiningHalls = user.surveyData.favoriteDiningHalls;
        const overlappingDiningHalls = otherUserDiningHalls.filter(hall => 
          userFavoriteDiningHalls.includes(hall)
        );
        
        return { 
          user, 
          overlap: overlappingDiningHalls.length,
          diningHalls: overlappingDiningHalls.length > 0 ? overlappingDiningHalls : otherUserDiningHalls,
          priorityScore
        };
      })
    );
    
    // Remove null entries (users with priority score of 0)
    const filteredUsers = usersWithPriorityScores.filter(user => user !== null) as Array<{
      user: UserProfile;
      overlap: number;
      diningHalls: string[];
      priorityScore: number;
    }>;
    
    // Sort by priority score (high to low) and then by dining hall overlap
    filteredUsers.sort((a, b) => {
      // First sort by priority score
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      // Then sort by dining hall overlap
      return b.overlap - a.overlap;
    });
    
    // Limit to 3 matches for demo purposes
    const usersToMatch = filteredUsers.slice(0, 3);
    
    for (const { user: otherUser, overlap, diningHalls, priorityScore } of usersToMatch) {
      // Check if already in matches
      if (matchedUsers.includes(otherUser.uid)) continue;
      
      // Get the other user's availability
      const otherUserAvailability = await getUserAvailability(otherUser.uid, new Date());
      
      // Skip if the other user has no availability
      if (!otherUserAvailability || Object.keys(otherUserAvailability.availability).length === 0) {
        continue;
      }
      
      matchedUsers.push(otherUser.uid);
      
      // Find overlapping availability between both users
      let validMatchFound = false;
      let matchDay = '';
      let matchTime = '';
      let matchDate: Date | null = null;
      
      // Randomly shuffle the available days to avoid always picking the first day
      const shuffledDays = [...availableDays].sort(() => 0.5 - Math.random());
      
      for (const day of shuffledDays) {
        // Skip if the current user has no availability for this day
        const userTimesForDay = userAvailability.availability[day];
        if (!userTimesForDay || userTimesForDay.length === 0) continue;
        
        // Skip if the other user has no availability for this day
        const otherUserTimesForDay = otherUserAvailability.availability[day] || [];
        if (otherUserTimesForDay.length === 0) continue;
        
        // Find overlapping times
        const overlappingTimes = userTimesForDay.filter(time => 
          otherUserTimesForDay.includes(time)
        );
        
        if (overlappingTimes.length > 0) {
          // Pick a random time from the overlapping available times
          const randomTimeIndex = Math.floor(Math.random() * overlappingTimes.length);
          matchTime = overlappingTimes[randomTimeIndex];
          matchDay = day;
          
          // Parse the date and time
          const [year, month, dayNum] = matchDay.split('-').map(Number);
          const [hours, minutes] = matchTime.split(':').map(Number);
          
          matchDate = new Date(year, month - 1, dayNum, hours, minutes);
          validMatchFound = true;
          break;
        }
      }
      
      // Skip if no valid match time found
      if (!validMatchFound || !matchDate) {
        continue;
      }
      
      // Pick location based on dining hall preferences
      let matchLocation;
      
      if (diningHalls.length > 0) {
        // If there are overlapping or at least one user's dining halls, pick from those
        const randomDiningHallIndex = Math.floor(Math.random() * diningHalls.length);
        matchLocation = diningHalls[randomDiningHallIndex];
      } else {
        // Fallback to default locations if no dining halls are available
        const randomLocationIndex = Math.floor(Math.random() * mealLocations.length);
        matchLocation = mealLocations[randomLocationIndex];
      }
      
      // Create a new match document
      const newMatch: Omit<Match, 'id'> = {
        userId,
        matchUserId: otherUser.uid,
        matchUser: otherUser,
        suggestedTime: Timestamp.fromDate(matchDate),
        suggestedLocation: matchLocation,
        status: 'pending',
        createdAt: Timestamp.now(),
        priorityScore // Add priority score to the match
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
    throw new Error("Failed to find meal matches.");
  }
};

// Accept a match
export const acceptMatch = async (userId: string, matchId: string): Promise<{status: string; phoneNumber?: string}> => {
  try {
    const matchRef = doc(db, "matches", matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) {
      throw new Error("Match not found");
    }
    
    const matchData = matchDoc.data() as Match;
    
    // Get the other user's ID
    let otherUserId: string;
    if (matchData.userId === userId) {
      // Current user is the creator of the match
      otherUserId = matchData.matchUserId;
    } else if (matchData.matchUserId === userId) {
      // Current user is the matched user
      otherUserId = matchData.userId;
    } else {
      // This match does not belong to the user
      throw new Error("You don't have permission to accept this match");
    }
    
    // Check if the match is already matched or declined
    if (matchData.status === 'matched') {
      return { status: 'already_matched' };
    }
    
    if (matchData.status === 'declined') {
      throw new Error("This match was declined and cannot be accepted");
    }
    
    // Begin a transaction to ensure consistency
    const batch = writeBatch(db);
    
    // Default: First user accepting the match
    let isFirstAcceptor = true;
    let phoneNumber = undefined;
    let newStatus = 'accepted';
    
    // Check if the other user has already accepted
    if (matchData.status === 'accepted' && matchData.acceptedBy) {
      // Other user already accepted, this is the second acceptance
      isFirstAcceptor = false;
      newStatus = 'matched';
      
      // Get other user's profile to get their phone number
      const otherUserProfile = await getUserProfile(otherUserId);
      if (otherUserProfile?.surveyData?.phoneNumber) {
        phoneNumber = otherUserProfile.surveyData.phoneNumber;
      }
      
      // Try to update priority score but don't let it block the match
      // Update priority score - increase significantly for successful match (+3)
      // The updatePriorityScore function now handles errors internally
      updatePriorityScore(userId, otherUserId, 3).catch(error => {
        console.error("Error updating priority score during match acceptance:", error);
      });
      
      // Create notification for first user
      const firstUserNotificationRef = doc(notificationsCollection);
      const firstUserNotification: Notification = {
        id: firstUserNotificationRef.id,
        userId: otherUserId,
        type: 'match_complete',
        content: `${matchData.status === 'accepted' ? 'Your match also accepted! They will text you soon.' : 'You have a new match!'} Meet at ${matchData.suggestedLocation} on ${new Date(matchData.suggestedTime.seconds * 1000).toLocaleDateString()} at ${new Date(matchData.suggestedTime.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`,
        relatedUserId: userId,
        relatedMatchId: matchId,
        read: false,
        createdAt: Timestamp.now()
      };
      batch.set(firstUserNotificationRef, firstUserNotification);
    } else {
      // This is the first user accepting, increase priority score slightly (+1)
      // The updatePriorityScore function now handles errors internally
      updatePriorityScore(userId, otherUserId, 1).catch(error => {
        console.error("Error updating priority score during match acceptance:", error);
      });
    }
    
    // Update the match with the new status and acceptance info
    const acceptedBy = matchData.acceptedBy || {};
    acceptedBy[userId] = {
      timestamp: Timestamp.now(),
      isFirst: isFirstAcceptor
    };
    
    // Update the match document
    batch.update(matchRef, {
      status: newStatus,
      acceptedBy: acceptedBy
    });
    
    // Commit all changes
    await batch.commit();
    
    return { 
      status: newStatus,
      phoneNumber
    };
  } catch (error) {
    console.error("Error accepting match:", error);
    throw new Error("Failed to accept meal match.");
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
    
    const matchData = matchDoc.data() as Match;
    
    // Verify this match belongs to the user
    if (matchData.userId !== userId && matchData.matchUserId !== userId) {
      throw new Error("You don't have permission to decline this match");
    }
    
    // Get the other user's ID
    const otherUserId = matchData.userId === userId ? matchData.matchUserId : matchData.userId;
    
    // Update priority score - decrease for declined match (-1)
    // The updatePriorityScore function now handles errors internally
    updatePriorityScore(userId, otherUserId, -1).catch(error => {
      console.error("Error updating priority score during match decline:", error);
    });
    
    // Update match status
    await updateDoc(matchRef, {
      status: 'declined'
    });
    
  } catch (error) {
    console.error("Error declining match:", error);
    throw new Error("Failed to decline meal match.");
  }
};

// Get user notifications
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const q = query(
      notificationsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const notificationsSnapshot = await getDocs(q);
    const notifications: Notification[] = [];
    
    notificationsSnapshot.forEach(doc => {
      notifications.push({ id: doc.id, ...doc.data() } as Notification);
    });
    
    return notifications;
  } catch (error) {
    console.error("Error getting user notifications:", error);
    throw new Error("Failed to get notifications.");
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(notificationsCollection, notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw new Error("Failed to update notification.");
  }
};
