"use client";

import { useMemo, useState } from "react";
import { Guest } from "@/hooks/use-guests";
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
import { UserProfile } from "@/hooks/use-user-profile";
import { EditGuestDialog } from "./edit-guest-dialog";

interface GuestListProps {
  guests: Guest[];
  isLoading: boolean;
  error?: string | null;
  userProfile: UserProfile | null;
  title?: string;
  className?: string;
}

export function GuestList({ guests, isLoading, error, userProfile, title, className }: GuestListProps) {
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
  };
  
  const handleCloseDialog = () => {
    setEditingGuest(null);
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
    <div className={className}>
      {title && <h3 className="text-md font-semibold mb-2 px-1">{title}</h3>}
      <div className="border rounded-lg w-full overflow-x-auto">
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
            {guests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">לא נמצאו מוזמנים רלוונטיים.</TableCell>
              </TableRow>
            ) : guests.map(guest => (
              <GuestTableRow key={guest.id} guest={guest} userProfile={userProfile} onEdit={handleEdit} />
            ))}
          </TableBody>
        </Table>
      </div>
      {editingGuest && (
        <EditGuestDialog
          guest={editingGuest}
          open={!!editingGuest}
          onOpenChange={(open) => { if (!open) handleCloseDialog() }}
        />
      )}
    </div>
  );
}
