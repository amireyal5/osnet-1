
"use client";

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CalendarOff, Home, Building } from "lucide-react";
import { useUserProfile, USER_ROLES, Center } from '@/hooks/use-user-profile';
import { useGuests } from '@/hooks/use-guests';
import { GuestList } from '../guests/guest-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditGuestDialog } from '../guests/edit-guest-dialog';
import { Guest } from '@/hooks/use-guests';
import { PersonalUpcomingMeetings } from './PersonalUpcomingMeetings';

export function UpcomingMeetings() {
    const { userProfile } = useUserProfile();
    const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

    const hasGlobalView = useMemo(() => {
        if (!userProfile) return false;
        return userProfile.roles.some(role => 
            [USER_ROLES.GENERAL_MANAGER, USER_ROLES.ADMIN, USER_ROLES.SECURITY].includes(role)
        );
    }, [userProfile]);

    const handleEditGuest = (guest: Guest) => {
        setEditingGuest(guest);
    };

    if (hasGlobalView) {
        return (
            <>
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>פגישות קרובות להיום (כללי)</CardTitle>
                    <CardDescription>סקירה של כל הפגישות הקרובות במערכת.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="welfare" dir="rtl">
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
                           <GuestList center="רווחה" onEditGuest={handleEditGuest} scope="all" />
                        </TabsContent>
                        <TabsContent value="familyCenter" className="mt-4">
                            <GuestList center="המרכז למשפחה" onEditGuest={handleEditGuest} scope="all" />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
            {editingGuest && (
                 <EditGuestDialog
                    guest={editingGuest}
                    open={!!editingGuest}
                    onOpenChange={(open) => {
                        if (!open) setEditingGuest(null);
                    }}
                />
            )}
            </>
        );
    }
    
    return <PersonalUpcomingMeetings />;
}

    