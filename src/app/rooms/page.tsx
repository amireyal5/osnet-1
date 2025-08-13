
"use client";

import { useMemo } from "react";
import { MainLayout } from "@/components/main-layout";
import { useUserProfile, USER_ROLES, Center } from "@/hooks/use-user-profile";
import { useUsers } from "@/hooks/use-users";
import { Loader2, Building, Home } from "lucide-react";
import { DailyAttendanceTable } from "@/components/daily-attendance/DailyAttendanceTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RoomManagementPage() {
    const { userProfile, isLoading: isProfileLoading } = useUserProfile();
    const { users, isLoading: areUsersLoading } = useUsers();

    const isLoading = isProfileLoading || areUsersLoading;

    const canAccess = useMemo(() => {
        if (!userProfile) return false;
        return userProfile.roles.some(role => 
            [USER_ROLES.SECURITY, USER_ROLES.ACCOUNTANT, USER_ROLES.SECRETARY].includes(role)
        );
    }, [userProfile]);

    const usersByCenter = (center: Center) => {
        return users.filter(user => user.center === center);
    }

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
                        <h1 className="text-3xl font-bold font-headline tracking-tight">ניהול חדרים</h1>
                        <p className="text-muted-foreground">
                            צפה בתוכניות העבודה של העובדים כדי לאתר חדרים זמינים לאורחים.
                        </p>
                    </div>
                </div>
                
                <Tabs defaultValue="welfare" className="w-full" dir="rtl">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="welfare">
                            <Home className="me-2 h-4 w-4" />
                            מרכז רווחה
                        </TabsTrigger>
                        <TabsTrigger value="familyCenter">
                            <Building className="me-2 h-4 w-4" />
                            המרכז למשפחה
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="welfare" className="mt-4">
                        <DailyAttendanceTable users={usersByCenter("רווחה")} />
                    </TabsContent>
                    <TabsContent value="familyCenter" className="mt-4">
                       <DailyAttendanceTable users={usersByCenter("המרכז למשפחה")} />
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}
