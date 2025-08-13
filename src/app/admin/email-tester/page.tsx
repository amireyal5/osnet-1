
"use client";

import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MainLayout } from "@/components/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";

const formSchema = z.object({
  to: z.string().email("יש להזין כתובת אימייל תקינה."),
  subject: z.string().min(1, "נושא המייל הוא שדה חובה."),
  body: z.string().min(1, "תוכן המייל הוא שדה חובה."),
});

type FormData = z.infer<typeof formSchema>;

export default function EmailTesterPage() {
    const { toast } = useToast();
    const { userProfile, isLoading: isProfileLoading } = useUserProfile();

    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            to: "",
            subject: 'מייל בדיקה ממערכת עו"סנט',
            body: "זוהי הודעת בדיקה אוטומטית כדי לוודא שמנגנון שליחת המיילים עובד כראוי.",
        }
    });

    const onSubmit = async (data: FormData) => {
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: data.to,
                    subject: data.subject,
                    template: 'custom',
                    body: data.body,
                }),
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Failed to send test email.');
            }

            toast({
                title: "הצלחה!",
                description: `מייל בדיקה נשלח בהצלחה אל ${data.to}`,
            });
        } catch (error: any) {
            console.error("Failed to send test email:", error);
            toast({
                title: "שגיאה בשליחת המייל",
                description: `אירעה שגיאה: ${error.message}`,
                variant: "destructive",
                duration: 10000,
            });
        }
    };

    const isLoading = isProfileLoading;

    if (isLoading) {
        return <MainLayout><div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" size={48} /></div></MainLayout>
    }

    const canAccess = userProfile && userProfile.roles.some(r => ['מנהל מערכת', 'ראש מנהל'].includes(r));

    if (!canAccess) {
        return <MainLayout><div className="text-center text-destructive">אין לך הרשאה לגשת לדף זה.</div></MainLayout>
    }

    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail />
                            בודק שליחת מיילים (Brevo)
                        </CardTitle>
                        <CardDescription>
                            השתמש בכלי זה כדי לשלוח מייל בדיקה ולוודא שתצורת ה-Brevo API שלך תקינה.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="to">אל (כתובת אימייל)</Label>
                                <Controller name="to" control={control} render={({ field }) => <Input id="to" {...field} dir="ltr" />} />
                                {errors.to && <p className="text-xs text-destructive">{errors.to.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="subject">נושא</Label>
                                <Controller name="subject" control={control} render={({ field }) => <Input id="subject" {...field} />} />
                                {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="body">תוכן ההודעה</Label>
                                <Controller name="body" control={control} render={({ field }) => <Textarea id="body" {...field} rows={5} />} />
                                {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="me-2 animate-spin" />}
                                    שלח מייל בדיקה
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
