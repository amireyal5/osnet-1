
"use client";

import { Guest, useGuests } from "@/hooks/use-guests";
import { UserProfile } from "@/hooks/use-user-profile";
import { format, isPast } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { TableCell, TableRow } from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash2, XCircle, LogIn, LogOut, Loader2, AlertTriangle, Edit, Ban } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { EditGuestDialog } from "./edit-guest-dialog";

interface GuestTableRowProps {
  guest: Guest;
  userProfile: UserProfile | null;
  onEdit: (guest: Guest) => void;
}

const getStatusVariant = (status: string) => {
    switch (status) {
      case "arrived": return "bg-green-100 text-green-800 border-green-200";
      case "departed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "no-show": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "scheduled": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "";
    }
};

const statusText: { [key: string]: string } = {
    scheduled: "מתוכנן",
    arrived: "הגיע",
    departed: "יצא",
    "no-show": "לא הגיע",
};

export function GuestTableRow({ guest, userProfile, onEdit }: GuestTableRowProps) {
    const { updateGuestStatus, deleteGuest, cancelGuest, isLoadingGuest } = useGuests();
    const [isUpdating, setIsUpdating] = useState(false);

    const getInitials = (name: string = '') => {
        const parts = name.split(' ');
        if (parts.length > 1) {
            return `${parts[0]?.charAt(0) ?? ''}${parts[parts.length - 1]?.charAt(0) ?? ''}`.toUpperCase();
        }
        return name.charAt(0).toUpperCase();
    };

    const handleUpdate = async (status: "arrived" | "departed" | "no-show") => {
      setIsUpdating(true);
      await updateGuestStatus(guest.id, status);
      setIsUpdating(false);
    }
    
    const isSecurity = userProfile?.roles.includes("מאבטח");
    const isOwner = userProfile?.id === guest.ownerId;
    const isManager = userProfile?.roles.some(r => ['מנהל מערכת', 'ראש מנהל'].includes(r));

    const isPastAppointment = isPast(guest.visitEndDateTime.toDate());

  return (
    <>
    <TableRow className={cn(
        guest.isCancelled && "opacity-50 bg-destructive/10",
        guest.atRisk && !guest.isCancelled && "bg-destructive/5 text-destructive",
        isPastAppointment && "opacity-60"
    )}>
      <TableCell>
        <div className="flex items-center gap-2">
            {guest.atRisk && <AlertTriangle className="h-4 w-4 text-destructive" />}
            <span>{guest.fullName}</span>
        </div>
      </TableCell>
      <TableCell>{format(guest.visitStartDateTime.toDate(), 'HH:mm')} - {format(guest.visitEndDateTime.toDate(), 'HH:mm')}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={guest.ownerPhotoURL || undefined} />
            <AvatarFallback>{getInitials(guest.ownerName)}</AvatarFallback>
          </Avatar>
          <span>{guest.ownerName}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={cn(getStatusVariant(guest.status), guest.atRisk && "border-destructive/20")}>
          {guest.isCancelled ? `בוטל ע"י מנהל` : statusText[guest.status]}
        </Badge>
      </TableCell>
      <TableCell>
        {isUpdating || isLoadingGuest[guest.id] ? <Loader2 className="animate-spin"/> : (
          <>
            {isSecurity && !guest.isCancelled && (
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => handleUpdate("arrived")} disabled={guest.status === 'arrived' || guest.status === 'departed' || isPastAppointment}>
                  <LogIn className="w-4 h-4 me-1" /> הגעה
                </Button>
                 <Button variant="outline" size="sm" onClick={() => handleUpdate("departed")} disabled={guest.status === 'departed' || guest.status !== 'arrived' || isPastAppointment}>
                  <LogOut className="w-4 h-4 me-1" /> יציאה
                </Button>
                <Button variant="destructive-outline" size="sm" onClick={() => handleUpdate("no-show")} disabled={guest.status !== 'scheduled' || isPastAppointment}>
                  <Ban className="w-4 h-4 me-1" /> לא הגיע
                </Button>
              </div>
            )}
            {!isSecurity && !guest.isCancelled && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={isPastAppointment}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(isOwner || isManager) && <DropdownMenuItem onSelect={() => onEdit(guest)}><Edit className="me-2 h-4 w-4"/> ערוך</DropdownMenuItem>}
                  {(isOwner || isManager) && <DropdownMenuItem className="text-destructive" onSelect={() => deleteGuest(guest, 'single')}><Trash2 className="me-2 h-4 w-4"/> מחק</DropdownMenuItem>}
                  {isManager && <DropdownMenuItem className="text-amber-600" onSelect={() => cancelGuest(guest.id)}><XCircle className="me-2 h-4 w-4"/> בטל</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        )}
      </TableCell>
    </TableRow>
    </>
  );
}
