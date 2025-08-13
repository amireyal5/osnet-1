
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
  deleteDoc,
  serverTimestamp,
  getDoc,
  updateDoc,
  setDoc,
  getDocs,
} from 'firebase/firestore';
import { useToast } from './use-toast';
import { Survey } from '@/types';

export interface SurveyResponse {
    id: string;
    userId: string;
    answers: Record<string, any>;
    submittedAt: any;
}

export function useSurveys() {
    const { toast } = useToast();
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const surveysQuery = query(collection(db, 'surveys'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(surveysQuery, 
            (snapshot) => {
                const surveysData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Survey));
                setSurveys(surveysData);
                setIsLoading(false);
            },
            (err) => {
                console.error("Error fetching surveys:", err);
                toast({
                    title: "שגיאה בטעינת סקרים",
                    description: "לא ניתן היה לטעון את רשימת הסקרים.",
                    variant: "destructive"
                });
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [toast]);

    const createSurvey = useCallback(async (surveyData: Omit<Survey, 'id' | 'createdAt'>): Promise<string> => {
        const surveysCollection = collection(db, 'surveys');
        const docRef = await addDoc(surveysCollection, {
            ...surveyData,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    }, []);
    
    const updateSurvey = useCallback(async (surveyId: string, surveyData: Partial<Omit<Survey, 'id' | 'createdAt'>>) => {
        const surveyRef = doc(db, 'surveys', surveyId);
        return updateDoc(surveyRef, {
            ...surveyData,
            updatedAt: serverTimestamp()
        });
    }, []);

    const deleteSurvey = useCallback(async (surveyId: string) => {
        const surveyRef = doc(db, 'surveys', surveyId);
        return deleteDoc(surveyRef);
    }, []);
    
    const getSurvey = useCallback(async (surveyId: string): Promise<Survey | null> => {
        const surveyRef = doc(db, 'surveys', surveyId);
        const docSnap = await getDoc(surveyRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Survey;
        }
        return null;
    }, []);

    const submitSurveyResponse = useCallback(async (surveyId: string, userId: string, answers: Record<string, any>) => {
        const responseRef = doc(db, `surveys/${surveyId}/responses`, userId);
        return setDoc(responseRef, {
            userId,
            answers,
            submittedAt: serverTimestamp(),
        });
    }, []);
    
    const hasUserSubmitted = useCallback(async (surveyId: string, userId: string): Promise<boolean> => {
        const responseRef = doc(db, `surveys/${surveyId}/responses`, userId);
        const docSnap = await getDoc(responseRef);
        return docSnap.exists();
    }, []);

    const getSurveyResponses = useCallback(async (surveyId: string): Promise<SurveyResponse[]> => {
        try {
            const responsesQuery = query(collection(db, `surveys/${surveyId}/responses`));
            const snapshot = await getDocs(responsesQuery);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SurveyResponse));
        } catch (error) {
            console.error("Error fetching survey responses:", error);
            toast({ title: "שגיאה בטעינת התגובות", variant: "destructive" });
            return [];
        }
    }, [toast]);


    return { surveys, isLoading, createSurvey, updateSurvey, deleteSurvey, getSurvey, submitSurveyResponse, hasUserSubmitted, getSurveyResponses };
}
