
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

export interface Team {
    id: string;
    name: string;
    teamLeadId: string;
    memberIds: string[];
}

export function useTeams() {
    const { userProfile } = useUserProfile();
    const { toast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        const teamsQuery = query(collection(db, 'teams'));

        const unsubscribe = onSnapshot(teamsQuery, 
            (snapshot) => {
                const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
                setTeams(teamsData);
                setIsLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Error fetching teams:", err);
                setError("אין הרשאה לצפות בצוותים.");
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const createTeam = useCallback(async (data: Omit<Team, 'id'>) => {
        if (!userProfile || !userProfile.roles.some(r => ['מנהל מערכת', 'ראש מנהל'].includes(r))) {
            throw new Error("Unauthorized");
        }
        await addDoc(collection(db, 'teams'), {
            ...data,
            createdAt: serverTimestamp()
        });
    }, [userProfile]);

    const updateTeam = useCallback(async (teamId: string, data: Partial<Omit<Team, 'id'>>) => {
        if (!userProfile || !userProfile.roles.some(r => ['מנהל מערכת', 'ראש מנהל'].includes(r))) {
            throw new Error("Unauthorized");
        }
        const teamRef = doc(db, 'teams', teamId);
        await updateDoc(teamRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    }, [userProfile]);

    const deleteTeam = useCallback(async (teamId: string) => {
         if (!userProfile || !userProfile.roles.some(r => ['מנהל מערכת', 'ראש מנהל'].includes(r))) {
            throw new Error("Unauthorized");
        }
        const teamRef = doc(db, 'teams', teamId);
        await deleteDoc(teamRef);
    }, [userProfile]);


    return { teams, isLoading, error, createTeam, updateTeam, deleteTeam };
}
