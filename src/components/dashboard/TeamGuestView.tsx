
"use client";

import { useGuests } from "@/hooks/use-guests";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GuestList } from "../guests/guest-list";
import { useMemo } from "react";

export function TeamGuestView() {
  const { userProfile } = useUserProfile();
  const { guests: teamGuests, isLoading: isTeamLoading, error: teamError } = useGuests({ daily: true, scope: 'team' });
  
  // Separate personal guests from the rest of the team's guests
  const { personalGuests, otherTeamGuests } = useMemo(() => {
    if (!userProfile) return { personalGuests: [], otherTeamGuests: [] };
    const personal = teamGuests.filter(g => g.ownerId === userProfile.id);
    const other = teamGuests.filter(g => g.ownerId !== userProfile.id);
    return { personalGuests: personal, otherTeamGuests: other };
  }, [teamGuests, userProfile]);

  return (
    <div className="flex flex-col gap-6">
       <Card className="h-full">
        <CardHeader>
          <CardTitle>הפגישות שלי</CardTitle>
        </CardHeader>
        <CardContent>
          <GuestList
            guests={personalGuests}
            isLoading={isTeamLoading}
            error={teamError}
            userProfile={userProfile}
          />
        </CardContent>
      </Card>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>פגישות הצוות</CardTitle>
          <CardDescription>סקירה של הפגישות של חברי הצוות שלך.</CardDescription>
        </CardHeader>
        <CardContent>
          <GuestList
            guests={otherTeamGuests}
            isLoading={isTeamLoading}
            error={teamError}
            userProfile={userProfile}
          />
        </CardContent>
      </Card>
    </div>
  );
}
