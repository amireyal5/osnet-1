
"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";
import { format, addMinutes, startOfDay } from "date-fns";
import { Switch } from "../ui/switch";
import { useGuests, Guest } from "@/hooks/use-guests";
import { RecurrenceEditDialog, RecurrenceEditScope } from "./recurrence-edit-dialog";

const formSchema = z.object({
  fullName: z.string().min(2, "שם מלא חייב להכיל לפחות 2 תווים."),
  visitDate: z.string().nonempty("יש לבחור תאריך."),
  visitStartTime: z.string().nonempty("יש לבחור שעת התחלה."),
  visitEndTime: z.string().nonempty("יש לבחור שעת סיום."),
  atRisk: z.boolean().default(false),
}).refine(data => data.visitEndTime > data.visitStartTime, {
    message: "שעת הסיום חייבת להיות אחרי שעת ההתחלה.",
    path: ["visitEndTime"],
}).refine(data => {
    const today = startOfDay(new Date());
    const selectedDate = startOfDay(new Date(data.visitDate));
    return selectedDate >= today;
}, {
    message: "לא ניתן לקבוע פגישות בתאריך עבר.",
    path: ["visitDate"],
});

type FormData = z.infer<typeof formSchema>;

interface EditGuestDialogProps {
    guest: Guest;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditGuestDialog({ guest, open, onOpenChange }: EditGuestDialogProps) {
    const { toast } = useToast();
    const { updateGuest, deleteGuest, isLoadingGuest } = useGuests();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isRecurrenceDialogOpen, setIsRecurrenceDialogOpen] = useState(false);
    const [recurrenceAction, setRecurrenceAction] = useState<'update' | 'delete' | null>(null);
    const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

    const { control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

    const visitStartTime = watch("visitStartTime");
    
    useEffect(() => {
        if (guest) {
            const start = guest.visitStartDateTime.toDate();
            const end = guest.visitEndDateTime.toDate();
            reset({
                fullName: guest.fullName,
                visitDate: format(start, "yyyy-MM-dd"),
                visitStartTime: format(start, "HH:mm"),
                visitEndTime: format(end, "HH:mm"),
                atRisk: guest.atRisk || false,
            });
        }
    }, [guest, reset]);

    useEffect(() => {
        if (!isDirty) return;
        try {
            const [hours, minutes] = visitStartTime.split(':').map(Number);
            const startDate = new Date();
            startDate.setHours(hours, minutes);
            const endDate = addMinutes(startDate, 50);
            setValue("visitEndTime", format(endDate, "HH:mm"));
        } catch (e) {
            // Ignore invalid time format during input
        }
    }, [visitStartTime, setValue, isDirty]);

    const handleFormSubmit = async (data: FormData) => {
        if (guest.isRecurring && isDirty) {
            setPendingFormData(data);
            setRecurrenceAction('update');
            setIsRecurrenceDialogOpen(true);
        } else {
            await executeUpdate(data, 'single');
        }
    };

    const executeUpdate = async (data: FormData, scope: RecurrenceEditScope) => {
        try {
            await updateGuest(guest, data, scope);
            toast({ title: "פגישה עודכנה בהצלחה" });
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating guest:", error);
            toast({ variant: "destructive", title: "שגיאה בעדכון פגישה", description: "אירעה שגיאה. נסה שוב." });
        } finally {
            setIsRecurrenceDialogOpen(false);
            setPendingFormData(null);
        }
    };

    const handleDeleteClick = () => {
        if (guest.isRecurring) {
            setRecurrenceAction('delete');
            setIsRecurrenceDialogOpen(true);
        } else {
            setIsDeleteDialogOpen(true);
        }
    };
    
    const executeDelete = async (scope: RecurrenceEditScope) => {
        try {
            await deleteGuest(guest, scope);
            toast({ title: "הפגישה נמחקה בהצלחה" });
            setIsRecurrenceDialogOpen(false);
            setIsDeleteDialogOpen(false);
            onOpenChange(false);
        } catch (error) {
             console.error("Error deleting guest:", error);
            toast({ variant: "destructive", title: "שגיאה במחיקת פגישה", description: "אירעה שגיאה. נסה שוב." });
        }
    };
    
    const handleRecurrenceChoice = (scope: RecurrenceEditScope) => {
        if (recurrenceAction === 'update' && pendingFormData) {
            executeUpdate(pendingFormData, scope);
        } else if (recurrenceAction === 'delete') {
            executeDelete(scope);
        }
    };


  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="font-headline">עריכת פגישה</DialogTitle>
          <DialogDescription>
            עדכן את פרטי הפגישה של {guest.fullName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="fullName">שם מלא של המוזמן</Label>
                    <Controller name="fullName" control={control} render={({ field }) => <Input id="fullName" {...field} />} />
                    {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="visitDate">תאריך</Label>
                    <Controller name="visitDate" control={control} render={({ field }) => <Input id="visitDate" type="date" {...field} />} />
                     {errors.visitDate && <p className="text-xs text-destructive">{errors.visitDate.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="visitStartTime">שעת התחלה</Label>
                        <Controller name="visitStartTime" control={control} render={({ field }) => <Input id="visitStartTime" type="time" {...field} />} />
                        {errors.visitStartTime && <p className="text-xs text-destructive">{errors.visitStartTime.message}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="visitEndTime">שעת סיום</Label>
                        <Controller name="visitEndTime" control={control} render={({ field }) => <Input id="visitEndTime" type="time" {...field} />} />
                        {errors.visitEndTime && <p className="text-xs text-destructive">{errors.visitEndTime.message}</p>}
                    </div>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                    <Controller name="atRisk" control={control} render={({ field }) => <Switch id="at-risk-edit" checked={field.value} onCheckedChange={field.onChange} />} />
                    <Label htmlFor="at-risk-edit">סמן כ'בסיכון'</Label>
                </div>
            </div>
            <DialogFooter className="justify-between">
                 <Button variant="destructive-outline" type="button" onClick={handleDeleteClick}>
                    <Trash2 className="me-2 h-4 w-4" />
                    מחק פגישה
                </Button>
                <div className="flex gap-2">
                    <DialogClose asChild>
                        <Button variant="outline" type="button">ביטול</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting || isLoadingGuest[guest.id] || !isDirty}>
                        {(isSubmitting || isLoadingGuest[guest.id]) && <Loader2 className="animate-spin me-2" />}
                        שמור שינויים
                    </Button>
                </div>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} dir="rtl">
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                <AlertDialogDescription>
                    פעולה זו תמחק את הפגישה לצמיתות. לא ניתן לבטל פעולה זו.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>ביטול</AlertDialogCancel>
                <AlertDialogAction onClick={() => executeDelete('single')} className="bg-destructive hover:bg-destructive/90">
                    כן, מחק פגישה
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    {recurrenceAction && (
        <RecurrenceEditDialog
            actionType={recurrenceAction}
            isOpen={isRecurrenceDialogOpen}
            onClose={() => setIsRecurrenceDialogOpen(false)}
            onConfirm={handleRecurrenceChoice}
        />
    )}
    </>
  )
}
