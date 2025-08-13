
"use client";

import { useMemo } from "react";
import { MainLayout } from "@/components/main-layout";
import { useUserProfile, USER_ROLES } from "@/hooks/use-user-profile";
import { useUsers } from "@/hooks/use-users";
import { useTeams } from "@/hooks/use-teams";
import { Loader2 } from "lucide-react";
import { StatusWall } from "@/components/daily-attendance/StatusWall";

export default function DailyAttendancePage() {
    const { userProfile, isLoading: isProfileLoading } = useUserProfile();
    const { users, isLoading: areUsersLoading } = useUsers();
    const { teams, isLoading: areTeamsLoading } = useTeams();

    const isLoading = isProfileLoading || areUsersLoading || areTeamsLoading;
    
    const authorizedRoles = [
        USER_ROLES.ADMIN,
        USER_ROLES.GENERAL_MANAGER,
        USER_ROLES.ACCOUNTANT,
        USER_ROLES.SECURITY,
        USER_ROLES.TEAM_LEAD
    ];

    const canAccess = userProfile && userProfile.roles.some(role => authorizedRoles.includes(role));
    
    const viewableUsers = useMemo(() => {
        if (!userProfile || !canAccess) return [];

        // Roles with full view
        if (userProfile.roles.some(r => [USER_ROLES.ADMIN, USER_ROLES.GENERAL_MANAGER, USER_ROLES.ACCOUNTANT, USER_ROLES.SECURITY].includes(r))) {
            return users;
        }

        // Team Lead view
        if (userProfile.roles.includes(USER_ROLES.TEAM_LEAD)) {
            const userTeams = teams.filter(team => team.teamLeadId === userProfile.id);
            const teamMemberIds = new Set(userTeams.flatMap(team => team.memberIds));
            teamMemberIds.add(userProfile.id); // Ensure team lead sees themselves
            return users.filter(user => teamMemberIds.has(user.id));
        }
        
        return [];

    }, [userProfile, users, teams, canAccess]);

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="animate-spin text-primary" size={48} />
                </div>
            </MainLayout>
        );
    }
    
    if (!canAccess) {
        return (
            <MainLayout>
                <div className="text-center text-destructive">אין לך הרשאה לגשת לדף זה.</div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="flex flex-col gap-4">
                 <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-headline tracking-tight">נוכחות יומית</h1>
                        <p className="text-muted-foreground">
                            תכנון עבודה יומי של העובדים. המידע מתעדכן אוטומטית מתוכניות העבודה השבועיות.
                        </p>
                    </div>
                </div>
                <StatusWall users={viewableUsers} />
            </div>
        </MainLayout>
    );
}
