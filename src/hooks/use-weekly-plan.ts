
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { startOfWeek, addDays, getISOWeek, eachDayOfInterval, format, endOfWeek } from "date-fns";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { DayPlan, WeeklyPlan } from "@/types/weekly-plan";
import { updatePlanDay, createPlan } from "@/services/firestoreService";

const getWeekId = (date: Date): string => {
  const year = date.getFullYear();
  const weekNumber = getISOWeek(date);
  return `${year}-W${weekNumber}`;
};

const generateEmptyPlan = (weekStart: Date): WeeklyPlan => {
  const plan: WeeklyPlan = {};
  const workDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 4) });
  workDays.forEach(day => {
    const dayKey = format(day, 'yyyy-MM-dd');
    plan[dayKey] = {
      activities: [{ type: 'נא למלא', isAllDay: true }],
      isConfirmed: false,
    };
  });
  return plan;
};

const getActiveDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const hour = today.getHours();
    
    if ((dayOfWeek === 4 && hour >= 16) || dayOfWeek === 5 || dayOfWeek === 6) {
        return addDays(today, 7);
    }
    return today;
}

function useWeeklyPlanInternal() {
    const [user] = useAuthState(auth);

    const [currentDate, setCurrentDate] = useState(() => getActiveDate());
    const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingDayKey, setEditingDayKey] = useState<string | null>(null);
    const [saveError, setSaveError] = useState(false);
    
    // Undo/Redo state
    const [history, setHistory] = useState<WeeklyPlan[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const isInitialLoad = useRef(true);
    const lastSavedPlan = useRef<WeeklyPlan | null>(null);
    const unsavedChanges = useRef<WeeklyPlan | null>(null);


    const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 0 }), [currentDate]);
    const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 0 }), [currentDate]);
    const weekId = useMemo(() => getWeekId(currentDate), [currentDate]);
    const workDays = useMemo(() => weeklyPlan ? Object.keys(weeklyPlan).sort() : [], [weeklyPlan]);
    
    const isDirty = useMemo(() => {
        if (!weeklyPlan || !lastSavedPlan.current) return false;
        return JSON.stringify(weeklyPlan) !== JSON.stringify(lastSavedPlan.current);
    }, [weeklyPlan]);

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    const recordHistory = useCallback((plan: WeeklyPlan) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(plan);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    const undo = useCallback(() => {
        if (canUndo) {
            setHistoryIndex(prev => prev - 1);
            setWeeklyPlan(history[historyIndex - 1]);
        }
    }, [canUndo, history, historyIndex]);

    const redo = useCallback(() => {
        if (canRedo) {
            setHistoryIndex(prev => prev + 1);
            setWeeklyPlan(history[historyIndex + 1]);
        }
    }, [canRedo, history, historyIndex]);


    const savePlan = useCallback(async (planToSave: WeeklyPlan) => {
        if (!user) return;
        
        setIsSaving(true);
        setSaveError(false);
        unsavedChanges.current = planToSave;
        try {
          // In Firestore, a `setDoc` with merge option or `updateDoc` on the whole doc is better for full plan updates.
          // Let's use `setDoc` for simplicity here to either create or overwrite.
          const planDocRef = doc(db, `users/${user.uid}/plans/${weekId}`);
          await setDoc(planDocRef, planToSave);
          lastSavedPlan.current = planToSave;
          unsavedChanges.current = null;
        } catch (error: any) {
             console.error("Error saving plan:", error);
             setSaveError(true);
        } finally {
          setIsSaving(false);
        }
    }, [user, weekId]);
    
    const retrySave = () => {
      if (unsavedChanges.current) {
        savePlan(unsavedChanges.current);
      }
    }

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        isInitialLoad.current = true;
        const planDocRef = doc(db, `users/${user.uid}/plans/${weekId}`);
        const unsubscribe = onSnapshot(planDocRef, (docSnap) => {
            let plan: WeeklyPlan;
            if (docSnap.exists()) {
                plan = docSnap.data() as WeeklyPlan;
            } else {
                plan = generateEmptyPlan(weekStart);
            }
            setWeeklyPlan(plan);
            lastSavedPlan.current = JSON.parse(JSON.stringify(plan));
            setIsLoading(false);
            
             // Initialize history
            setHistory([plan]);
            setHistoryIndex(0);

            if (isInitialLoad.current) {
                const isNewPlan = Object.values(plan).every(day => 
                    day.activities.length === 1 && day.activities[0].type === 'נא למלא'
                );
                if (isNewPlan) {
                    const firstDayKey = Object.keys(plan).sort()[0];
                    setEditingDayKey(firstDayKey);
                }
                isInitialLoad.current = false;
            }

        }, (error) => {
            console.error("Error fetching weekly plan:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, weekId, weekStart]); 
    
    const updateDayPlan = useCallback((dayKey: string, dayPlan: DayPlan) => {
        const newPlan = {
            ...weeklyPlan!,
            [dayKey]: dayPlan,
        };
        setWeeklyPlan(newPlan);
        recordHistory(newPlan);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            savePlan(newPlan);
        }, 2000);
    }, [weeklyPlan, recordHistory, savePlan]);
    
    const autofillPlan = useCallback(() => {
        if (!weeklyPlan) return;
        const newPlan = { ...weeklyPlan };
        Object.keys(newPlan).forEach(dayKey => {
            newPlan[dayKey] = {
                activities: [{ type: 'במשרד', isAllDay: true }],
                isConfirmed: false,
            }
        });
        setWeeklyPlan(newPlan);
        recordHistory(newPlan);
        
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            savePlan(newPlan);
        }, 1000); // Shorter debounce for autofill
    }, [weeklyPlan, recordHistory, savePlan]);


    return { 
        user,
        weeklyPlan, 
        isLoading, 
        currentDate, 
        setCurrentDate, 
        weekId, 
        weekStart,
        weekEnd,
        workDays,
        updateDayPlan,
        editingDayKey,
        setEditingDayKey,
        isDirty,
        isSaving,
        saveError,
        retrySave,
        undo,
        redo,
        canUndo,
        canRedo,
        autofillPlan,
    };
}

export function useWeeklyPlan() {
    return useWeeklyPlanInternal();
}
