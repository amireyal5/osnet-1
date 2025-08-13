
"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/main-layout";
import { useAuthCheck } from "@/hooks/use-auth-check";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CreateGuestDialog } from "@/components/guests/create-guest-dialog";
import { useUserProfile } from "@/hooks/use-user-profile";
import { GuestCalendar } from "@/components/guests/guest-calendar";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { EditGuestDialog } from "@/components/guests/edit-guest-dialog";
import { Guest } from "@/hooks/use-guests";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { Loader2 } from "lucide-react";

export type CalendarView = "month" | "week" | "day";

export default function GuestsPage() {
    const { isLoading: isAuthLoading } = useAuthCheck();
    const { userProfile, isLoading: isProfileLoading } = useUserProfile();
    
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const [dialogInitialDateTime, setDialogInitialDateTime] = useState<Date | null>(null);

    const [view, setView] = useState<CalendarView>("month");

    const isLoading = isAuthLoading || isProfileLoading;

    const canCreateGuest = userProfile && userProfile.roles.some(role => ['עובד', 'מנהל מערכת', 'ראש מנהל', 'ראש צוות', 'אבטחה']);

    if (isLoading) {
        return <MainLayout><div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" size={48} /></div></MainLayout>
    }

    const handleTimeSlotClick = (dateTime: Date) => {
        setDialogInitialDateTime(dateTime);
        setIsCreateDialogOpen(true);
    };

    const handleGuestClick = (guest: Guest) => {
        setSelectedGuest(guest);
        setIsEditDialogOpen(true);
    }

    return (
        <MainLayout>
            <div className="flex flex-col gap-4 h-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold font-headline tracking-tight">ניהול מוזמנים</h1>
                        <p className="text-muted-foreground">
                            תזמן ונהל את רשימת המוזמנים והפגישות.
                        </p>
                    </div>
                    {canCreateGuest && (
                        <div className="flex items-center gap-2">
                             <Button onClick={() => { setDialogInitialDateTime(new Date()); setIsCreateDialogOpen(true); }}>
                                <PlusCircle className="h-4 w-4 me-2" />
                                הוסף מוזמן
                            </Button>
                        </div>
                    )}
                </div>
                <StatsCards />
                <Tabs defaultValue="month" onValueChange={(value) => setView(value as CalendarView)} dir="rtl" className="flex flex-col flex-1">
                    <div className="flex justify-end">
                        <TabsList>
                            <TabsTrigger value="day">יום</TabsTrigger>
                            <TabsTrigger value="week">שבוע</TabsTrigger>
                            <TabsTrigger value="month">חודש</TabsTrigger>
                        </TabsList>
                    </div>
                    <GuestCalendar 
                        view={view} 
                        onTimeSlotClick={handleTimeSlotClick} 
                        onGuestClick={handleGuestClick}
                    />
                </Tabs>
            </div>
             {canCreateGuest && (
                <CreateGuestDialog 
                    open={isCreateDialogOpen} 
                    onOpenChange={setIsCreateDialogOpen}
                    initialDateTime={dialogInitialDateTime}
                />
             )}
             {selectedGuest && (
                <EditGuestDialog
                    guest={selectedGuest}
                    open={isEditDialogOpen}
                    onOpenChange={(open) => {
                        setIsEditDialogOpen(open);
                        if (!open) setSelectedGuest(null);
                    }}
                />
            )}
        </MainLayout>
    );
}
