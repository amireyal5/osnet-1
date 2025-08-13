
"use client";

import { useState } from "react";
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
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

const formSchema = z.object({
  email: z.string().email("יש להזין כתובת אימייל תקינה."),
});

type FormData = z.infer<typeof formSchema>;

interface ForgotPasswordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
    const { toast } = useToast();
    
    const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "" },
    });

    const onSubmit = async (data: FormData) => {
        try {
            await sendPasswordResetEmail(auth, data.email);
            toast({
                title: "מייל איפוס נשלח",
                description: "בדוק את תיבת הדואר הנכנס שלך לקבלת קישור לאיפוס הסיסמה.",
                duration: 10000,
            });
            onOpenChange(false);
            reset();
        } catch (error: any) {
            console.error("Error sending password reset email:", error);
            let description = "אירעה שגיאה. נסה שוב.";
            if (error.code === 'auth/user-not-found') {
                description = "לא נמצא משתמש עם כתובת אימייל זו.";
            }
            toast({
                variant: "destructive",
                title: "שגיאה בשליחת מייל",
                description: description,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle className="font-headline">איפוס סיסמה</DialogTitle>
                    <DialogDescription>
                        הזן את כתובת המייל שלך ואנו נשלח לך קישור לאיפוס הסיסמה.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">כתובת אימייל</Label>
                            <Controller name="email" control={control} render={({ field }) => <Input id="email" {...field} dir="ltr" />} />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" type="button" onClick={() => reset()}>ביטול</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="animate-spin me-2" />}
                            שלח קישור לאיפוס
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
