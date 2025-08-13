"use client";

import { useMemo } from 'react';
import { useUserProfile, USER_ROLES } from '@/hooks/use-user-profile';
import { PersonalGuestView } from './PersonalGuestView';
import { TeamGuestView } from './TeamGuestView';
import { GlobalGuestView } from './GlobalGuestView';

/**
 * This component acts as a "view router".
 * It determines which guest view to display based on the user's role.
 */
export function UpcomingMeetings() {
    const { userProfile } = useUserProfile();

    const view = useMemo(() => {
        if (!userProfile) return 'personal'; // Default or loading state

        const roles = userProfile.roles;
        if (roles.some(r => [USER_ROLES.ADMIN, USER_ROLES.GENERAL_MANAGER, USER_ROLES.SECURITY].includes(r))) {
            return 'global';
        }
        if (roles.includes(USER_ROLES.TEAM_LEAD)) {
            return 'team';
        }
        return 'personal';
    }, [userProfile]);

    if (!userProfile) {
        return <PersonalGuestView />; // Or a loading skeleton
    }

    switch (view) {
        case 'global':
            return <GlobalGuestView />;
        case 'team':
            return <TeamGuestView />;
        case 'personal':
        default:
            return <PersonalGuestView />;
    }
}
