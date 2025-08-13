
"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { useToast } from './use-toast';
import { UserProfile } from './use-user-profile';

export interface VehicleRequest {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    purpose: string;
    address: string;
    startDateTime: Timestamp;
    endDateTime: Timestamp;
    status: 'pending' | 'handled';
    createdAt: Timestamp;
}

export function useVehicleRequests(enabled: boolean = true) {
    const { toast } = useToast();
    const [requests, setRequests] = useState<VehicleRequest[]>([]);
    const [isLoading, setIsLoading] = useState(enabled);

    useEffect(() => {
        if (!enabled) {
            setIsLoading(false);
            setRequests([]);
            return;
        }

        setIsLoading(true);
        const requestsQuery = query(collection(db, 'vehicleRequests'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(requestsQuery, 
            (snapshot) => {
                const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VehicleRequest));
                setRequests(requestsData);
                setIsLoading(false);
            },
            (err) => {
                console.error("Error fetching vehicle requests:", err);
                toast({
                    title: "שגיאה בטעינת בקשות",
                    description: "אין לך הרשאה לצפות בנתונים.",
                    variant: "destructive"
                });
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [toast, enabled]);

    const createVehicleRequest = useCallback(async (data: any, userProfile: UserProfile) => {
        const startDateTime = new Date(data.startDateTime);
        const [endHours, endMinutes] = data.endTime.split(':').map(Number);
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(endHours, endMinutes);

        const requestData = {
            userId: userProfile.id,
            userName: `${userProfile.firstName} ${userProfile.lastName}`,
            userEmail: userProfile.email,
            purpose: data.purpose,
            address: data.address,
            startDateTime: Timestamp.fromDate(startDateTime),
            endDateTime: Timestamp.fromDate(endDateTime),
            status: 'pending' as const,
            createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'vehicleRequests'), requestData);
    }, []);
    
    const updateRequestStatus = useCallback(async (requestId: string, status: 'pending' | 'handled') => {
        const requestRef = doc(db, 'vehicleRequests', requestId);
        try {
            await updateDoc(requestRef, { status });
            toast({ title: 'סטטוס הבקשה עודכן' });
        } catch (error) {
            console.error("Error updating request status:", error);
            toast({ title: 'שגיאה בעדכון הסטטוס', variant: 'destructive' });
        }
    }, [toast]);

    return { requests, isLoading, createVehicleRequest, updateRequestStatus };
}
