
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useUserProfile, UserProfile } from './use-user-profile';
import { useTeams } from './use-teams';

export interface Guest {
    id: string;
    fullName: string;
    visitStartDateTime: Timestamp;
    visitEndDateTime: Timestamp;
    status: 'scheduled' | 'arrived' | 'departed' | 'no-show';
    ownerId: string;
    ownerName: string;
    ownerPhotoURL: string | null;
    center: UserProfile['center'];
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
  scope: 'personal' | 'team' | 'global';
}

export function useGuests({ daily = false, dateRange, scope = 'personal' }: UseGuestsOptions) {
  const { userProfile } = useUserProfile();
  const { teams } = useTeams(); // Needed for team scope
  const { toast } = useToast();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({ global: true });
  const [error, setError] = useState<string | null>(null);
  
  const teamMemberIds = useMemo(() => {
    if (scope !== 'team' || !userProfile) return [];
    const myTeams = teams.filter(t => t.teamLeadId === userProfile.id);
    return myTeams.flatMap(t => t.memberIds || []);
  }, [scope, userProfile, teams]);

  useEffect(() => {
    if (!userProfile) {
      setIsLoading({ global: false });
      return;
    }

    const guestsCollection = collection(db, 'guests');
    let guestsQuery;

    // Define date range for query
    const range = dateRange ? dateRange : daily ? { start: startOfDay(new Date()), end: endOfDay(new Date()) } : null;
    if (!range) {
        setIsLoading({ global: false });
        return;
    }

    // Base query with date filter and ordering
    const baseQueryConstraints = [
        where('visitStartDateTime', '>=', range.start),
        where('visitStartDateTime', '<=', range.end),
        orderBy('visitStartDateTime', 'asc')
    ];

    // Add scope-specific filter
    if (scope === 'personal') {
        guestsQuery = query(guestsCollection, where('ownerId', '==', userProfile.id), ...baseQueryConstraints);
    } else if (scope === 'team') {
        if (teamMemberIds.length > 0) {
            guestsQuery = query(guestsCollection, where('ownerId', 'in', teamMemberIds), ...baseQueryConstraints);
        } else {
            // Team lead with no team members - show only personal
             guestsQuery = query(guestsCollection, where('ownerId', '==', userProfile.id), ...baseQueryConstraints);
        }
    } else { // 'global'
        guestsQuery = query(guestsCollection, ...baseQueryConstraints);
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
        setError("שגיאת הרשאות או צורך באינדקס. בדוק את קונסולת הדפדפפן.");
        setIsLoading({ global: false });
      }
    );

    return () => unsubscribe();
  }, [userProfile, daily, dateRange, scope, teamMemberIds]);


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
