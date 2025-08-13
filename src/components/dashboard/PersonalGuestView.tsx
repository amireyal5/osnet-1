"use client";

import { useGuests } from "@/hooks/use-guests";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GuestList } from "../guests/guest-list";

export function PersonalGuestView() {
  const { userProfile } = useUserProfile();
  const { guests, isLoading, error } = useGuests({ daily: true, scope: 'personal' });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>הפגישות שלי להיום</CardTitle>
        <CardDescription>סקירה מהירה של הפגישות האישיות שלך.</CardDescription>
      </CardHeader>
      <CardContent>
        <GuestList
          guests={guests}
          isLoading={isLoading}
          error={error}
          userProfile={userProfile}
        />
      </CardContent>
    </Card>
  );
}
