
"use client";

import React, { useState, useEffect, useContext, createContext, useMemo } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

export type UserStatus = "פעיל" | "ממתין לאישור" | "מושבת";

export const USER_ROLES = {
    ADMIN: 'מנהל מערכת',
    GENERAL_MANAGER: 'ראש מנהל',
    TEAM_LEAD: 'ראש צוות',
    UNIT_COORDINATOR: 'רכז יחידה',
    EMPLOYEE: 'עובד',
    SOCIAL_WORKER: 'עובד סוציאלי',
    SECURITY: 'מאבטח',
    ACCOUNTANT: 'תחשיבנית',
    SECRETARY: 'מזכירה',
    PENDING: 'בהמתנה',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const CENTERS = [
    "רווחה", "מרכז עצמה", "בית המתנדב", "המרכז למשפחה"
] as const;

export type Center = typeof CENTERS[number];


export const EMERGENCY_TEAMS = [
    'מכלול אוכלוסיה', 'תא רווחה', 'התערבות באזור תקרית', 'התנדבות', 
    'קהילה', 'מי יציל את המציל', 'קו פתוח', 'בשורה מרה', 'ללא שיוך'
] as const;

export const EMERGENCY_ROLES = [
    'ראש מכלול', 'סגן ראש מכלול', 'ראש תא', 'סגן ראש תא', 
    'ראש צוות', 'סגן ראש צוות', 'חבר צוות', 'מזכיר/ה', 'רשם/ת', 'ללא תפקיד'
] as const;

export type EmergencyTeam = typeof EMERGENCY_TEAMS[number];
export type EmergencyRole = typeof EMERGENCY_ROLES[number];

export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    roles: UserRole[]; 
    status: UserStatus;
    photoURL?: string;
    unitId?: string | null;
    createdAt?: Timestamp;
    managerIds?: string[];
    center?: Center;
    theme?: string;

    // New Fields
    dateOfBirth?: Timestamp | null;
    addressCity?: string;
    addressStreet?: string;
    addressHouseNumber?: string;
    addressApartmentNumber?: string;
    mobilePhone?: string;
    officePhone?: string;
    emergencyInfo?: {
        team: EmergencyTeam;
        role: EmergencyRole;
    } | null;
    isProfileComplete?: boolean;
}

interface AuthUserContextType {
    userProfile: UserProfile | null;
    isLoading: boolean;
}

const AuthUserContext = createContext<AuthUserContextType>({
    userProfile: null,
    isLoading: true,
});

export const AuthUserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, authLoading] = useAuthState(auth);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        let lastPrimaryTheme = 'forest';

        if (authLoading) {
            setIsLoading(true);
            return;
        }
        
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data() as any;
                    const profile: UserProfile = { id: doc.id, ...data };
                    setUserProfile(profile);

                    // Apply theme logic
                    let themeId = profile.theme || 'forest';
                    
                    if (themeId !== 'clean_white') {
                        lastPrimaryTheme = themeId;
                    }

                    // For 'clean_white', apply the primary from the last known primary theme
                    if (themeId === 'clean_white') {
                        // Create a temporary element to read CSS variables from a different theme
                        const tempDiv = document.createElement('div');
                        tempDiv.style.display = 'none';
                        tempDiv.setAttribute('data-theme', lastPrimaryTheme);
                        document.body.appendChild(tempDiv);
                        
                        const computedStyle = getComputedStyle(tempDiv);
                        const primaryColor = computedStyle.getPropertyValue('--primary').trim();
                        
                        document.body.removeChild(tempDiv);

                        // Set the primary color from the last theme
                        document.documentElement.style.setProperty('--primary', primaryColor);
                    } else {
                        // Reset inline style if not 'clean_white'
                         document.documentElement.style.removeProperty('--primary');
                    }

                    document.documentElement.setAttribute('data-theme', themeId);


                } else {
                    setUserProfile(null);
                }
                setIsLoading(false);
            }, (error) => {
                console.error("Failed to fetch user profile:", error);
                setUserProfile(null);
                setIsLoading(false);
            });
        } else {
            setUserProfile(null);
            setIsLoading(false);
            document.documentElement.setAttribute('data-theme', 'forest'); // Default theme
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user, authLoading]);

    const value = useMemo(() => ({ userProfile, isLoading }), [userProfile, isLoading]);
    
    return (
        <AuthUserContext.Provider value={value}>
            {children}
        </AuthUserContext.Provider>
    );
};

export const useUserProfile = () => {
    const context = useContext(AuthUserContext);
    if (context === undefined) {
        throw new Error('useUserProfile must be used within an AuthUserProvider');
    }
    return context;
};
