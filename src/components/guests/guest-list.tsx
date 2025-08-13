
"use client";

import { useMemo } from "react";
import { useGuests, Guest } from "@/hooks/use-guests";
import { useUserProfile } from "@/hooks/use-user-profile";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { GuestTableRow } from "./guest-table-row";
import { Center } from "@/hooks/use-user-profile";

interface GuestListProps {
  center: Center;
  onEditGuest: (guest: Guest) => void;
  scope?: 'user' | 'all';
}

export function GuestList({ center, onEditGuest, scope = 'user' }: GuestListProps) {
  const { userProfile } = useUserProfile();
  const { guests: allDailyGuests, isLoading, error } = useGuests({ daily: true, scope: scope });

  const processedGuests = useMemo(() => {
    return allDailyGuests
      .filter(guest => guest.center === center)
      .sort((a, b) => a.visitStartDateTime.toMillis() - b.visitStartDateTime.toMillis());
  }, [allDailyGuests, center]);

  const handleEdit = (guest: Guest) => {
    onEditGuest(guest);
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin me-2" /> טוען נתונים...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" dir="rtl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>שגיאה</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card dir="rtl" className="w-full">
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם המוזמן</TableHead>
                <TableHead>שעת ביקור</TableHead>
                <TableHead>עובד מארח</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedGuests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">לא נמצאו מוזמנים להיום במרכז זה.</TableCell>
                </TableRow>
              ) : processedGuests.map(guest => (
                <GuestTableRow key={guest.id} guest={guest} userProfile={userProfile} onEdit={handleEdit} />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

    