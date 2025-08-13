
"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';
import { useToast } from './use-toast';
import { UserProfile } from './use-user-profile';

export function useUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const usersQuery = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(usersQuery, 
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        setUsers(usersData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setError("אין לך הרשאה לצפות ברשימת המשתמשים. בדוק את חוקי האבטחה ב-Firebase Console ונסה שוב.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateUser = useCallback(async (userId: string, data: Partial<Omit<UserProfile, 'id'>>) => {
    const userRef = doc(db, 'users', userId);
    try {
      await updateDoc(userRef, data as any);
      toast({ title: 'משתמש עודכן בהצלחה' });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'שגיאה בעדכון משתמש',
        description: 'אירעה שגיאה. בדוק את הרשאות הכתיבה שלך.',
        variant: 'destructive',
      });
      throw error; // Re-throw the error for the form to catch
    }
  }, [toast]);

  return { users, isLoading, error, updateUser };
}
