"use client";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useVehicleRequests } from "@/hooks/use-vehicle-requests";
import { Textarea } from "../ui/textarea";

const formSchema = z.object({
  purpose: z.string().min(5, "מטרת הנסיעה חייבת להכיל לפחות 5 תווים."),
  address: z.string().min(5, "כתובת חייבת להכיל לפחות 5 תווים."),
  startDateTime: z.string().nonempty("יש לבחור תאריך ושעת יציאה."),
  endTime: z.string().nonempty("יש לבחור שעת חזרה."),
}).refine(data => {
    try {
        if (!data.startDateTime || !data.endTime) return true; // Let other validations handle empty fields
        const start = new Date(data.startDateTime);
        const [endHours, endMinutes] = data.endTime.split(':').map(Number);
        const end = new Date(start);
        end.setHours(endHours, endMinutes);
        
        if (end <= start) {
             // Handle case where end time is on the next day (e.g., start 23:00, end 01:00)
            if (end.getHours() < start.getHours()) {
                // This logic is complex, for now we assume same-day return.
                return false;
            }
        }
        return true;
    } catch {
        return false;
    }
}, {
    message: "שעת הסיום חייבת להיות אחרי שעת ההתחלה באותו היום.",
    path: ["endTime"],
});

type FormData = z.infer<typeof formSchema>;

interface SecurityVehicleRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SecurityVehicleRequestDialog({ open, onOpenChange }: SecurityVehicleRequestDialogProps) {
    const { toast } = useToast();
    const { userProfile } = useUserProfile();
    const { createVehicleRequest } = useVehicleRequests();
    
    const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            purpose: "",
            address: "",
            startDateTime: "",
            endTime: "",
        },
    });

    const onSubmit = async (data: FormData) => {
        if (!userProfile) {
            toast({ title: "שגיאה", description: "עליך להתחבר כדי להגיש בקשה.", variant: "destructive" });
            return;
        }

        try {
            await createVehicleRequest(data, userProfile);

            const requestDetails = {
                ...data,
                userName: `${userProfile.firstName} ${userProfile.lastName}`
            };

            // Send confirmation to user
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: userProfile.email,
                    name: userProfile.firstName,
                    subject: 'אישור קבלת בקשה לרכב ביטחון',
                    template: 'vehicleRequestConfirmation',
                    requestDetails: requestDetails,
                }),
            });

            // Send notification to admin
             await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: "yael_s@karmiel.muni.il",
                    name: "מנהל/ת",
                    subject: `בקשה חדשה לרכב ביטחון מ - ${userProfile.firstName} ${userProfile.lastName}`,
                    template: 'vehicleRequestNotification',
                    requestDetails: requestDetails,
                }),
            });

            toast({ title: "הבקשה נשלחה בהצלחה", description: "תקבל מייל אישור. הבקשה הועברה לטיפול." });
            onOpenChange(false);
            reset();
        } catch (error) {
            console.error("Failed to submit request:", error);
            toast({ title: "שגיאה בשליחת הבקשה", variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle className="font-headline">הזמנת רכב ביטחון לליווי</DialogTitle>
                    <DialogDescription>
                        מלא את פרטי הנסיעה. הבקשה תועבר לאישור.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                        <Label>שם העובד/ת</Label>
                        <Input value={`${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`} disabled />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="purpose">מטרת הנסיעה</Label>
                        <Controller name="purpose" control={control} render={({ field }) => <Textarea id="purpose" {...field} />} />
                        {errors.purpose && <p className="text-xs text-destructive">{errors.purpose.message}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="address">כתובת</Label>
                        <Controller name="address" control={control} render={({ field }) => <Input id="address" {...field} />} />
                        {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="grid gap-2">
                            <Label htmlFor="startDateTime">תאריך ושעת יציאה</Label>
                            <Controller name="startDateTime" control={control} render={({ field }) => <Input id="startDateTime" type="datetime-local" {...field} />} />
                            {errors.startDateTime && <p className="text-xs text-destructive">{errors.startDateTime.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="endTime">שעת חזרה (באותו יום)</Label>
                            <Controller name="endTime" control={control} render={({ field }) => <Input id="endTime" type="time" {...field} />} />
                            {errors.endTime && <p className="text-xs text-destructive">{errors.endTime.message}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" onClick={() => reset()}>ביטול</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="animate-spin me-2" />}
                            שלח בקשה
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
