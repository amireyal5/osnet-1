
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Building } from "lucide-react";
import { useUserProfile } from '@/hooks/use-user-profile';
import { useGuests } from '@/hooks/use-guests';
import { GuestList } from '../guests/guest-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function GlobalGuestView() {
    const { userProfile } = useUserProfile();
    const { guests, isLoading, error } = useGuests({ daily: true, scope: 'global' });
    
    const welfareGuests = guests.filter(g => g.center === "רווחה");
    const familyCenterGuests = guests.filter(g => g.center === "המרכז למשפחה");

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>פגישות קרובות להיום (תצוגה גלובלית)</CardTitle>
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
                       <GuestList 
                            guests={welfareGuests}
                            isLoading={isLoading}
                            error={error}
                            userProfile={userProfile}
                       />
                    </TabsContent>
                    <TabsContent value="familyCenter" className="mt-4">
                       <GuestList 
                            guests={familyCenterGuests}
                            isLoading={isLoading}
                            error={error}
                            userProfile={userProfile}
                       />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
