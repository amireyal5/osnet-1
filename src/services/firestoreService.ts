
// src/services/firestoreService.ts
/**
 * @fileOverview This service layer abstracts all Firestore interactions.
 * It provides a centralized set of functions for creating, reading, updating,
 * and deleting documents, ensuring that hooks and components remain decoupled
 * from the underlying database implementation.
 */
"use strict";

import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  addDoc,
  setDoc,
  Timestamp,
  query,
  where,
  getDocs,
  FieldValue,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { parseISO, addWeeks, format, addDays, differenceInMilliseconds, getDay, startOfDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { DayPlan, WeeklyPlan } from "@/types/weekly-plan";
import type { UserProfile, UserRole, UserStatus, Center } from "@/hooks/use-user-profile";
import type { Guest, Survey } from "@/types";
import type { Thread } from "@/hooks/use-notifications";

export type RecurrenceFrequency = "daily" | "weekly" | "biweekly" | "custom";


// --- User Management ---

export const userProfileExists = async (userId: string): Promise<boolean> => {
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);
    return docSnap.exists();
}


/**
 * Creates a new user profile document in Firestore.
 * @param user - The Firebase Auth user object.
 * @param firstName - The user's first name.
 * @param lastName - The user's last name.
 */
export const createUserProfileDocument = (user: any, firstName: string, lastName: string) => {
    const userRef = doc(db, "users", user.uid);
    return setDoc(userRef, {
        firstName: firstName,
        lastName: lastName,
        email: user.email,
        photoURL: user.photoURL,
        roles: ["בהמתנה"] as UserRole[],
        status: "ממתין לאישור" as UserStatus,
        createdAt: serverTimestamp(),
        isProfileComplete: false,
    });
}

/**
 * Creates a user profile document for a user signing in with a provider like Google.
 * @param user - The Firebase Auth user object.
 */
export const createProviderUserProfileDocument = (user: any) => {
    const nameParts = user.displayName?.split(' ') || ['', ''];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    const userRef = doc(db, "users", user.uid);

    return setDoc(userRef, {
        firstName,
        lastName,
        email: user.email,
        photoURL: user.photoURL,
        roles: ["בהמתנה"] as UserRole[],
        status: "ממתין לאישור" as UserStatus,
        createdAt: serverTimestamp(),
        isProfileComplete: false,
    });
}


// --- Guest Management ---
export type RecurrenceEditScope = 'single' | 'future' | 'all';

const getTimestampsFromData = (data: any) => {
    const visitStartDateTime = new Date(`${data.visitDate}T${data.visitStartTime}`);
    const visitEndDateTime = new Date(`${data.visitDate}T${data.visitEndTime}`);
    return {
        visitStartDateTime: Timestamp.fromDate(visitStartDateTime),
        visitEndDateTime: Timestamp.fromDate(visitEndDateTime),
    };
};

/**
 * Creates a single guest appointment.
 * @param data - The guest data from the form.
 * @param userProfile - The currently authenticated user's profile.
 */
export const createGuest = (data: any, userProfile: UserProfile) => {
  const { visitStartDateTime, visitEndDateTime } = getTimestampsFromData(data);
  return addDoc(collection(db, "guests"), {
    fullName: data.fullName,
    visitStartDateTime,
    visitEndDateTime,
    status: "scheduled",
    ownerId: userProfile.id,
    ownerName: `${userProfile.firstName} ${userProfile.lastName}`,
    ownerPhotoURL: userProfile.photoURL || null,
    center: userProfile.center || 'רווחה',
    createdAt: Timestamp.now(),
    isCancelled: false,
    atRisk: data.atRisk,
    isRecurring: false,
    seriesId: data.isRecurring ? uuidv4() : null,
  });
};

/**
 * Updates an existing guest appointment or a series of appointments.
 * @param guest - The original guest object being edited.
 * @param data - The new guest data from the form.
 * @param scope - The scope of the update ('single', 'future', 'all').
 */
export const updateGuest = async (guest: Guest, data: any, scope: RecurrenceEditScope) => {
    if (!guest.isRecurring || scope === 'single') {
        const { visitStartDateTime, visitEndDateTime } = getTimestampsFromData(data);
        const guestDocRef = doc(db, "guests", guest.id);
        return updateDoc(guestDocRef, {
            fullName: data.fullName,
            visitStartDateTime,
            visitEndDateTime,
            atRisk: data.atRisk,
            // If it was part of a series, it's now a standalone exception
            seriesId: scope === 'single' ? null : guest.seriesId, 
            isRecurring: scope === 'single' ? false : guest.isRecurring, 
        });
    }

    const batch = writeBatch(db);
    const guestsCollection = collection(db, "guests");
    let q;

    if (scope === 'all') {
        q = query(guestsCollection, where('seriesId', '==', guest.seriesId));
    } else { // 'future'
        q = query(guestsCollection, 
            where('seriesId', '==', guest.seriesId), 
            where('visitStartDateTime', '>=', guest.visitStartDateTime)
        );
    }

    const snapshot = await getDocs(q);
    const originalStartDateTime = guest.visitStartDateTime.toDate();
    const newStartDateTime = new Date(`${data.visitDate}T${data.visitStartTime}`);
    
    // Calculate difference in time of day and day of week
    const timeDiff = newStartDateTime.getTime() - startOfDay(newStartDateTime).getTime() 
                   - (originalStartDateTime.getTime() - startOfDay(originalStartDateTime).getTime());
    const dayOfWeekDiff = newStartDateTime.getDay() - originalStartDateTime.getDay();
    
    const newDuration = new Date(`${data.visitDate}T${data.visitEndTime}`).getTime() - newStartDateTime.getTime();


    snapshot.forEach(docRef => {
        const guestDoc = docRef.data() as Guest;
        const currentVisitStart = guestDoc.visitStartDateTime.toDate();
        
        // Apply day of week and time of day adjustments
        let updatedVisitStart = addDays(currentVisitStart, dayOfWeekDiff);
        updatedVisitStart = new Date(updatedVisitStart.getTime() + timeDiff);

        const updatedVisitEnd = new Date(updatedVisitStart.getTime() + newDuration);
        
        batch.update(docRef.ref, {
            fullName: data.fullName,
            atRisk: data.atRisk,
            visitStartDateTime: Timestamp.fromDate(updatedVisitStart),
            visitEndDateTime: Timestamp.fromDate(updatedVisitEnd)
        });
    });

    return batch.commit();
}

/**
 * Creates a series of recurring weekly guests.
 * @param data - The guest data from the form.
 * @param userProfile - The currently authenticated user's profile.
 */
export const createRecurringGuests = async (data: any, userProfile: UserProfile) => {
  const batch = writeBatch(db);
  const seriesId = uuidv4();
  const frequency = data.recurringFrequency as RecurrenceFrequency;

  let currentDate = parseISO(data.visitDate);
  const endDate = parseISO(data.recurringEndDate);

  while (currentDate <= endDate) {
    const { visitStartDateTime, visitEndDateTime } = getTimestampsFromData({
        ...data,
        visitDate: format(currentDate, 'yyyy-MM-dd')
    });

    const guestRef = doc(collection(db, "guests"));
    batch.set(guestRef, {
      fullName: data.fullName,
      visitStartDateTime,
      visitEndDateTime,
      status: "scheduled",
      ownerId: userProfile.id,
      ownerName: `${userProfile.firstName} ${userProfile.lastName}`,
      ownerPhotoURL: userProfile.photoURL || null,
      center: userProfile.center || 'רווחה',
      createdAt: Timestamp.now(),
      isCancelled: false,
      atRisk: data.atRisk,
      isRecurring: true,
      seriesId: seriesId,
    });

    switch (frequency) {
        case 'daily':
            currentDate = addDays(currentDate, 1);
            break;
        case 'weekly':
            currentDate = addWeeks(currentDate, 1);
            break;
        case 'biweekly':
             currentDate = addWeeks(currentDate, 2);
            break;
        default: 
            // End loop if frequency is not recognized
            currentDate = addDays(endDate, 1);
            break;
    }
  }

  await batch.commit();
};

/**
 * Updates the status of a specific guest.
 * @param guestId - The ID of the guest to update.
 * @param status - The new status to set.
 */
export const updateGuestStatus = (guestId: string, status: "scheduled" | "arrived" | "departed" | "no-show") => {
  const guestRef = doc(db, 'guests', guestId);
  return updateDoc(guestRef, { status });
};

/**
 * Deletes a guest or a series of guests.
 * @param guest - The guest object to delete.
 * @param scope - The scope of the deletion ('single', 'future', 'all').
 */
export const deleteGuest = async (guest: Guest, scope: RecurrenceEditScope) => {
    if (!guest.isRecurring || scope === 'single') {
        const guestRef = doc(db, 'guests', guest.id);
        return deleteDoc(guestRef);
    }
    
    const batch = writeBatch(db);
    const guestsCollection = collection(db, "guests");
    let q;

    if (scope === 'all') {
        q = query(guestsCollection, where('seriesId', '==', guest.seriesId));
    } else { // 'future'
        q = query(guestsCollection, 
            where('seriesId', '==', guest.seriesId), 
            where('visitStartDateTime', '>=', guest.visitStartDateTime)
        );
    }

    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    return batch.commit();
};

/**
 * Marks a guest visit as cancelled.
 * @param guestId - The ID of the guest to cancel.
 * @param userId - The ID of the user performing the cancellation.
 */
export const cancelGuest = (guestId: string, userId: string) => {
  const guestRef = doc(db, 'guests', guestId);
  return updateDoc(guestRef, {
    isCancelled: true,
    cancelledBy: userId,
    cancelledAt: serverTimestamp(),
  });
};

// --- Weekly Plan Management ---

/**
 * Updates a specific day in a user's weekly plan.
 * @param userId - The ID of the user whose plan is being updated.
 * @param weekId - The ID of the week (e.g., "2023-W42").
 * @param dayKey - The key for the day being updated (e.g., "2023-10-23").
 * @param dayPlan - The new plan data for that day.
 */
export const updatePlanDay = (userId: string, weekId: string, dayKey: string, dayPlan: DayPlan) => {
  const planDocRef = doc(db, `users/${userId}/plans/${weekId}`);
  return updateDoc(planDocRef, { [dayKey]: dayPlan });
};

/**
 * Creates a new weekly plan document if it doesn't exist.
 * @param userId - The ID of the user.
 * @param weekId - The ID of the week.
 * @param newPlan - The full weekly plan object to create.
 */
export const createPlan = (userId: string, weekId: string, newPlan: WeeklyPlan) => {
  const planDocRef = doc(db, `users/${userId}/plans/${weekId}`);
  return setDoc(planDocRef, newPlan);
}


// --- Notifications / Threads ---

/**
 * Atomically creates a new notification thread and its first message.
 * @param threadData - The initial data for the new thread, including a complete participants list.
 * @param initialMessage - The first message to add to the thread.
 */
export const createThread = async (threadData: any, initialMessage: { senderId: string, content: string, contentType: 'text', timestamp: any }) => {
    const batch = writeBatch(db);
    
    // 1. Create a reference for the new thread document.
    const threadRef = doc(collection(db, 'threads'));
    
    // 2. Set the data for the new thread document in the batch.
    // The threadData is now expected to be complete and correct from the hook.
    batch.set(threadRef, threadData);

    // 3. Create a reference for the first message within the new thread's subcollection.
    const messageRef = doc(collection(threadRef, 'messages'));
    
    // 4. Set the data for the first message in the batch.
    batch.set(messageRef, initialMessage);

    // 5. Commit the batch. Both documents will be created together, and security rules will evaluate the final state.
    await batch.commit();
    
    // Return the reference to the newly created thread.
    return threadRef;
};

/**
 * Sends a message in an existing thread.
 * @param threadId - The ID of the thread.
 * @param messageData - The message data to send.
 * @param updateData - The data to update on the parent thread document.
 */
export const sendMessage = (threadId: string, messageData: any, updateData: any) => {
    const batch = writeBatch(db);
    
    const messageRef = doc(collection(db, 'threads', threadId, 'messages'));
    batch.set(messageRef, messageData);

    const threadRef = doc(db, 'threads', threadId);
    batch.update(threadRef, updateData);

    return batch.commit();
};

/**
 * Marks a message as deleted.
 * @param threadId - The ID of the thread containing the message.
 * @param messageId - The ID of the message to delete.
 */
export const deleteMessage = (threadId: string, messageId: string) => {
    const messageRef = doc(db, 'threads', threadId, 'messages', messageId);
    return updateDoc(messageRef, {
        content: 'הודעה זו נמחקה',
        status: 'deleted',
        contentType: 'text',
        fileURL: null,
        fileName: null,
    });
};

/**
 * Resets the unread count for a user in a specific thread.
 * @param threadId - The ID of the thread.
 * @param userId - The ID of the user whose unread count to reset.
 */
export const resetUnreadCount = (threadId: string, userId: string) => {
    const threadRef = doc(db, 'threads', threadId);
    return updateDoc(threadRef, {
        [`unreadCounts.${userId}`]: 0
    });
}

/**
 * Hides a thread from a specific user's view.
 * @param threadId The ID of the thread to hide.
 * @param userId The ID of the user for whom to hide the thread.
 */
export const hideThreadForUser = (threadId: string, userId: string) => {
    const threadRef = doc(db, "threads", threadId);
    return updateDoc(threadRef, {
        hiddenBy: arrayUnion(userId)
    });
};

/**
 * Updates the typing status for a user in a thread.
 * @param threadId The ID of the thread.
 * @param userId The ID of the user who is typing.
 * @param isTyping Whether the user is typing or not.
 */
export const updateTypingStatus = (threadId: string, userId: string, isTyping: boolean) => {
    const threadRef = doc(db, "threads", threadId);
    return updateDoc(threadRef, {
        typingUsers: isTyping ? arrayUnion(userId) : arrayRemove(userId)
    });
};

// --- Survey Management ---

/**
 * Creates a new survey document in Firestore.
 * @param surveyData - The data for the new survey.
 */
export const createSurvey = (surveyData: Omit<Survey, 'id' | 'createdAt'>) => {
    const surveysCollection = collection(db, 'surveys');
    return addDoc(surveysCollection, {
        ...surveyData,
        createdAt: serverTimestamp(),
    });
};
