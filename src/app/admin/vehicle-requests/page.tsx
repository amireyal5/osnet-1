
"use client";

import { MainLayout } from "@/components/main-layout";
import { useAuthCheck } from "@/hooks/use-auth-check";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Loader2 } from "lucide-react";
import { useVehicleRequests } from "@/hooks/use-vehicle-requests";
import { VehicleRequestsTable } from "@/components/admin/vehicle-requests/VehicleRequestsTable";

export default function VehicleRequestsPage() {
    useAuthCheck();
    const { userProfile, isLoading: isProfileLoading } = useUserProfile();
    const { requests, isLoading: areRequestsLoading, updateRequestStatus } = useVehicleRequests();

    const isLoading = isProfileLoading || areRequestsLoading;

    // Only General Manager or Admin can manage requests
    const canManage = userProfile && userProfile.roles.some(r => ['ראש מנהל', 'מנהל מערכת'].includes(r));

    if (isLoading) {
        return <MainLayout><div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" size={48} /></div></MainLayout>
    }

    if (!canManage) {
         return <MainLayout><div className="text-center text-destructive">אין לך הרשאה לגשת לדף זה.</div></MainLayout>
    }

    return (
        <MainLayout>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-headline tracking-tight">ניהול בקשות רכב ביטחון</h1>
                        <p className="text-muted-foreground">
                            צפה ונהל את הבקשות שהוגשו על ידי העובדים.
                        </p>
                    </div>
                </div>

                <VehicleRequestsTable requests={requests} onUpdateStatus={updateRequestStatus} />
            </div>
        </MainLayout>
    );
}
