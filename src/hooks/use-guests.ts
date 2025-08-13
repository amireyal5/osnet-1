
"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  onSnapshot,
  Timestamp,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { startOfDay, endOfDay } from 'date-fns';
import { useToast } from './use-toast';
import * as firestoreService from '@/services/firestoreService';
import { useUserProfile, UserProfile, Center, USER_ROLES } from './use-user-profile';

export interface Guest {
    id: string;
    fullName: string;
    visitStartDateTime: Timestamp;
    visitEndDateTime: Timestamp;
    status: 'scheduled' | 'arrived' | 'departed' | 'no-show';
    ownerId: string;
    ownerName: string;
    ownerPhotoURL: string | null;
    center: Center;
    createdAt: Timestamp;
    isCancelled: boolean;
    cancelledBy?: string;
    cancelledAt?: Timestamp;
    atRisk?: boolean;
    isRecurring?: boolean;
    seriesId?: string;
}

interface UseGuestsOptions {
  daily?: boolean;
  dateRange?: { start: Date, end: Date };
  scope?: 'user' | 'all';
}

export function useGuests({ daily = false, dateRange, scope = 'user' }: UseGuestsOptions = {}) {
  const { userProfile } = useUserProfile();
  const { toast } = useToast();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({ global: true });
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!userProfile) {
      setIsLoading({ global: false });
      return;
    }

    const guestsCollection = collection(db, 'guests');
    let guestsQuery;
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const hasGlobalView = userProfile.roles.some(r => 
        [USER_ROLES.ADMIN, USER_ROLES.GENERAL_MANAGER, USER_ROLES.SECURITY].includes(r)
    );

    const effectiveScope = hasGlobalView ? scope : 'user';

    if (daily) {
      if (effectiveScope === 'all') {
        // Global view for admins, managers, security
        guestsQuery = query(
          guestsCollection,
          where('visitStartDateTime', '>=', todayStart),
          where('visitStartDateTime', '<=', todayEnd),
          orderBy('visitStartDateTime', 'asc')
        );
      } else {
        // User-specific view for employees
        guestsQuery = query(
          guestsCollection,
          where('ownerId', '==', userProfile.id),
          where('visitStartDateTime', '>=', todayStart),
          where('visitStartDateTime', '<=', todayEnd),
          orderBy('visitStartDateTime', 'asc')
        );
      }
    } else if (dateRange) {
        // This part is mainly for the calendar view, which might also need scope adjustments
         if (effectiveScope === 'all') {
            guestsQuery = query(
                guestsCollection,
                where('visitStartDateTime', '>=', dateRange.start),
                where('visitStartDateTime', '<=', dateRange.end)
            );
        } else {
             guestsQuery = query(
                guestsCollection,
                where('ownerId', '==', userProfile.id),
                where('visitStartDateTime', '>=', dateRange.start),
                where('visitStartDateTime', '<=', dateRange.end)
            );
        }
    } else {
        setIsLoading({ global: false });
        return;
    }


    const unsubscribe = onSnapshot(guestsQuery, 
      (snapshot) => {
        const guestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guest));
        setGuests(guestsData);
        setIsLoading({ global: false });
        setError(null);
      },
      (err) => {
        console.error("Error fetching guests:", err);
        setError("שגיאת הרשאות או צורך באינדקס. בדוק את קונסולת הדפדפפן לקבלת קישור ליצירת אינדקס אם נדרש.");
        setIsLoading({ global: false });
      }
    );

    return () => unsubscribe();
  }, [userProfile, daily, dateRange, scope]);


  const setLoadingForGuest = (guestId: string, value: boolean) => {
    setIsLoading(prev => ({...prev, [guestId]: value}));
  }

  const createGuest = useCallback(async (data: any, profile: UserProfile) => {
      if (!profile) throw new Error("User not authenticated");
      await firestoreService.createGuest(data, profile);
  }, []);

  const updateGuest = useCallback(async (guest: Guest, data: any, scope: firestoreService.RecurrenceEditScope) => {
    setLoadingForGuest(guest.id, true);
    try {
      await firestoreService.updateGuest(guest, data, scope);
      toast({ title: "הפגישה עודכנה בהצלחה" });
    } catch (e) {
      console.error("Error updating guest:", e);
      toast({ title: "שגיאה בעדכון פגישה", variant: "destructive" });
    } finally {
      setLoadingForGuest(guest.id, false);
    }
  }, [toast]);


  const createRecurringGuests = useCallback(async (data: any, profile: UserProfile) => {
    if (!profile) throw new Error("User not authenticated");
    await firestoreService.createRecurringGuests(data, profile);
  }, []);


  const updateGuestStatus = useCallback(async (guestId: string, status: Guest['status']) => {
    if (!userProfile) return;
    setLoadingForGuest(guestId, true);
    try {
      await firestoreService.updateGuestStatus(guestId, status);
      toast({ title: "סטטוס עודכן בהצלחה" });
    } catch (e) {
      console.error("Error updating guest status:", e);
      toast({ title: "שגיאה בעדכון סטטוס", variant: "destructive" });
    } finally {
        setLoadingForGuest(guestId, false);
    }
  }, [userProfile, toast]);

  const deleteGuest = useCallback(async (guest: Guest, scope: firestoreService.RecurrenceEditScope) => {
    if (!userProfile) return;
    setLoadingForGuest(guest.id, true);
    try {
        await firestoreService.deleteGuest(guest, scope);
        toast({ title: "המוזמן נמחק בהצלחה" });
    } catch (e) {
        console.error("Error deleting guest:", e);
        toast({ title: "שגיאה במחיקת מוזמן", variant: "destructive" });
    } finally {
        setLoadingForGuest(guest.id, false);
    }
  }, [userProfile, toast]);

  const cancelGuest = useCallback(async (guestId: string) => {
    if (!userProfile) return;
    setLoadingForGuest(guestId, true);
    try {
        await firestoreService.cancelGuest(guestId, userProfile.id);
        toast({ title: "הביקור בוטל" });
    } catch (e) {
        console.error("Error cancelling guest:", e);
        toast({ title: "שגיאה בביטול הביקור", variant: "destructive" });
    } finally {
        setLoadingForGuest(guestId, false);
    }
  }, [userProfile, toast]);

  return { guests, isLoading: isLoading.global, error, createGuest, createRecurringGuests, updateGuest, updateGuestStatus, deleteGuest, cancelGuest, isLoadingGuest: isLoading };
}
