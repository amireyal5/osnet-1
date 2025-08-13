
"use client";

import { useGuests } from "@/hooks/use-guests";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, CalendarOff } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function PersonalUpcomingMeetings() {
  const { guests, isLoading } = useGuests({ daily: true, scope: 'user' });

  const upcomingGuests = guests
    .filter(g => new Date(g.visitStartDateTime.toDate()) > new Date())
    .sort((a, b) => a.visitStartDateTime.toMillis() - b.visitStartDateTime.toMillis());

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>פגישות קרובות להיום</CardTitle>
        <CardDescription>סקירה מהירה של הפגישות הבאות שלך.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-8 h-full"><Loader2 className="animate-spin" /></div>
        ) : upcomingGuests.length === 0 ? (
          <div className="text-center text-muted-foreground p-8 flex flex-col justify-center items-center h-full">
            <CalendarOff className="mx-auto h-12 w-12" />
            <p className="mt-4">אין פגישות קרובות להיום.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingGuests.slice(0, 5).map((guest, index) => (
              <div
                key={guest.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  index === 0 ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                )}
              >
                <div className="flex flex-col">
                  <span className={cn("font-bold", index === 0 && "text-primary")}>{guest.fullName}</span>
                  <span className="text-sm text-muted-foreground">
                    {format(guest.visitStartDateTime.toDate(), 'HH:mm')} - {format(guest.visitEndDateTime.toDate(), 'HH:mm')}
                  </span>
                </div>
                {guest.atRisk && (
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-semibold hidden sm:inline">בסיכון</span>
                    </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    