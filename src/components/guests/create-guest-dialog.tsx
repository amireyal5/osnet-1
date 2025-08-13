
"use client";

import { useEffect } from "react";
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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format, addMonths, addMinutes, startOfDay } from "date-fns";
import { Switch } from "../ui/switch";
import { useGuests } from "@/hooks/use-guests";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { RecurrenceFrequency } from "@/services/firestoreService";

const formSchema = z.object({
  fullName: z.string().min(2, "שם מלא חייב להכיל לפחות 2 תווים."),
  visitDate: z.string().nonempty("יש לבחור תאריך."),
  visitStartTime: z.string().nonempty("יש לבחור שעת התחלה."),
  visitEndTime: z.string().nonempty("יש לבחור שעת סיום."),
  atRisk: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.string().optional(),
  recurringEndDate: z.string().optional(),
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

interface CreateGuestDialogProps {
    children?: React.ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialDateTime: Date | null;
}

export function CreateGuestDialog({ children, open, onOpenChange, initialDateTime }: CreateGuestDialogProps) {
    const { toast } = useToast();
    const { userProfile } = useUserProfile();
    const { createGuest, createRecurringGuests } = useGuests();
    
    const { control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            visitDate: format(new Date(), "yyyy-MM-dd"),
            visitStartTime: format(new Date(), "HH:mm"),
            visitEndTime: format(addMinutes(new Date(), 50), "HH:mm"),
            atRisk: false,
            isRecurring: false,
            recurringFrequency: "weekly",
            recurringEndDate: format(addMonths(new Date(), 3), "yyyy-MM-dd"),
        },
    });
    
    const isRecurring = watch("isRecurring");
    const visitStartTime = watch("visitStartTime");

    useEffect(() => {
        if(initialDateTime) {
            const start = initialDateTime;
            const end = addMinutes(start, 50);
             reset({
                fullName: "",
                visitDate: format(start, "yyyy-MM-dd"),
                visitStartTime: format(start, "HH:mm"),
                visitEndTime: format(end, "HH:mm"),
                atRisk: false,
                isRecurring: false,
                recurringFrequency: "weekly",
                recurringEndDate: format(addMonths(new Date(), 3), "yyyy-MM-dd"),
            });
        }
    }, [initialDateTime, reset]);
    
    useEffect(() => {
        try {
            const [hours, minutes] = visitStartTime.split(':').map(Number);
            const startDate = new Date();
            startDate.setHours(hours, minutes);
            const endDate = addMinutes(startDate, 50);
            setValue("visitEndTime", format(endDate, "HH:mm"));
        } catch (e) {
            // Ignore invalid time format during input
        }
    }, [visitStartTime, setValue]);


    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        if (!userProfile) {
             toast({ variant: "destructive", title: "שגיאה", description: "עליך להיות מחובר כדי להוסיף מוזמן." });
            return;
        }

        try {
            if (data.isRecurring) {
                if (!data.recurringFrequency) {
                    toast({ variant: "destructive", title: "שגיאה", description: "יש לבחור תדירות לפגישה חוזרת." });
                    return;
                }
                await createRecurringGuests(data, userProfile);
                toast({ title: "סדרת פגישות נוצרה בהצלחה", description: "המוזמנים החוזרים נוספו ללוח השנה." });
            } else {
                await createGuest(data, userProfile);
                toast({ title: "מוזמן נוסף בהצלחה", description: "המוזמן נוסף לרשימה היומית." });
            }

            onOpenChange(false);
            reset();

        } catch (error) {
            console.error("Error creating guest:", error);
            toast({ variant: "destructive", title: "שגיאה ביצירת מוזמן", description: "אירעה שגיאה. נסה שוב." });
        }
    }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="font-headline">הוספת מוזמן חדש</DialogTitle>
          <DialogDescription>
            מלא את הפרטים ליצירת הזמנה חדשה.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
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
                    <Controller name="atRisk" control={control} render={({ field }) => <Switch id="at-risk" checked={field.value} onCheckedChange={field.onChange} />} />
                    <Label htmlFor="at-risk">סמן כ'בסיכון'</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                    <Controller name="isRecurring" control={control} render={({ field }) => <Switch id="is-recurring" checked={field.value} onCheckedChange={field.onChange} />} />
                    <Label htmlFor="is-recurring">פגישה חוזרת</Label>
                </div>
                {isRecurring && (
                     <div className="grid grid-cols-2 gap-4 pt-2 border-t mt-2">
                        <div className="grid gap-2">
                            <Label>תדירות</Label>
                             <Controller
                                name="recurringFrequency"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="בחר תדירות" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">יומי</SelectItem>
                                            <SelectItem value="weekly">שבועי</SelectItem>
                                            <SelectItem value="biweekly">דו-שבועי</SelectItem>
                                            <SelectItem value="custom" disabled>מותאם אישית (בקרוב)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="recurringEndDate">תאריך סיום</Label>
                            <Controller name="recurringEndDate" control={control} render={({ field }) => <Input id="recurringEndDate" type="date" {...field} />} />
                        </div>
                     </div>
                )}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" type="button">ביטול</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting || !userProfile}>
                    {isSubmitting && <Loader2 className="animate-spin me-2" />}
                    {isRecurring ? "צור סדרת פגישות" : "הוסף מוזמן"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
