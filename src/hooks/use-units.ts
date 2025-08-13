
"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useToast } from './use-toast';
import { useUserProfile } from './use-user-profile';

export interface Unit {
    id: string;
    name: string;
    specialtyDescription?: string;
    coordinatorId?: string | null;
    memberIds?: string[];
}

export function useUnits() {
    const { userProfile } = useUserProfile();
    const { toast } = useToast();
    const [units, setUnits] = useState<Unit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        const unitsQuery = query(collection(db, 'units'));

        const unsubscribe = onSnapshot(unitsQuery, 
            (snapshot) => {
                const unitsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
                setUnits(unitsData);
                setIsLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Error fetching units:", err);
                setError("אין הרשאה לצפות ביחידות.");
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const createUnit = useCallback(async (data: Omit<Unit, 'id'>) => {
        if (!userProfile || !userProfile.roles.some(r => ['מנהל מערכת', 'ראש מנהל'].includes(r))) {
            throw new Error("Unauthorized");
        }
        await addDoc(collection(db, 'units'), {
            ...data,
            createdAt: serverTimestamp()
        });
    }, [userProfile]);

    const updateUnit = useCallback(async (unitId: string, data: Partial<Omit<Unit, 'id'>>) => {
        if (!userProfile || !userProfile.roles.some(r => ['מנהל מערכת', 'ראש מנהל'].includes(r))) {
            throw new Error("Unauthorized");
        }
        const unitRef = doc(db, 'units', unitId);
        await updateDoc(unitRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    }, [userProfile]);

    const deleteUnit = useCallback(async (unitId: string) => {
         if (!userProfile || !userProfile.roles.some(r => ['מנהל מערכת', 'ראש מנהל'].includes(r))) {
            throw new Error("Unauthorized");
        }
        const unitRef = doc(db, 'units', unitId);
        await deleteDoc(unitRef);
    }, [userProfile]);

    return { units, isLoading, error, createUnit, updateUnit, deleteUnit };
}
