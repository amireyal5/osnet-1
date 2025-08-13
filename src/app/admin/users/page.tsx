
"use client";

import { MainLayout } from "@/components/main-layout";
import { useAuthCheck } from "@/hooks/use-auth-check";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Loader2 } from "lucide-react";
import { useUsers } from "@/hooks/use-users";
import { UsersTable } from "@/components/admin/users/UsersTable";

export default function UsersPage() {
    useAuthCheck();
    const { userProfile, isLoading: isProfileLoading } = useUserProfile();
    const { users, isLoading: areUsersLoading } = useUsers();

    const isLoading = isProfileLoading || areUsersLoading;

    // Only Admin can manage users
    const canManageUsers = userProfile && userProfile.roles.some(r => ['מנהל מערכת', 'ראש מנהל'].includes(r));

    if (isLoading) {
        return <MainLayout><div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" size={48} /></div></MainLayout>
    }

    if (!canManageUsers) {
         return <MainLayout><div className="text-center text-destructive">אין לך הרשאה לגשת לדף זה.</div></MainLayout>
    }

    return (
        <MainLayout>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-headline tracking-tight">ניהול משתמשים</h1>
                        <p className="text-muted-foreground">
                            ערוך ונהל את המשתמשים בארגון.
                        </p>
                    </div>
                </div>

                <UsersTable users={users} />
            </div>
        </MainLayout>
    );
}
