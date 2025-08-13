
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile, EMERGENCY_TEAMS, EMERGENCY_ROLES, CENTERS, Center } from "@/hooks/use-user-profile";
import { useUsers } from "@/hooks/use-users";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Timestamp } from "firebase/firestore";

const israelPhoneRegex = /^(05\d|0[2-4,6-9,77,73,72])(-?\d){7}$/;

const formSchema = z.object({
  dateOfBirth: z.string().min(1, "תאריך לידה הוא שדה חובה."),
  addressCity: z.string().min(2, "שם עיר הוא שדה חובה."),
  addressStreet: z.string().min(2, "שם רחוב הוא שדה חובה."),
  addressHouseNumber: z.string().min(1, "מספר בית הוא שדה חובה."),
  addressApartmentNumber: z.string().min(1, "מספר דירה הוא שדה חובה (יש למלא 0 אם אין)."),
  mobilePhone: z.string().regex(israelPhoneRegex, "מספר טלפון נייד לא תקין."),
  officePhone: z.string().regex(israelPhoneRegex, "מספר טלפון קווי לא תקין."),
  emergencyTeam: z.enum(EMERGENCY_TEAMS),
  emergencyRole: z.enum(EMERGENCY_ROLES),
  center: z.enum(CENTERS, { required_error: "שיוך למרכז הוא שדה חובה." }),
});

type FormData = z.infer<typeof formSchema>;

export default function CompleteProfilePage() {
    const router = useRouter();
    const { toast } = useToast();
    const { userProfile, isLoading: isProfileLoading } = useUserProfile();
    const { updateUser } = useUsers();

    const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(formSchema)
    });

    useEffect(() => {
        if (!isProfileLoading && !userProfile) {
            // Not signed in, redirect to signup
            router.push('/signup');
        }
        if (userProfile?.isProfileComplete) {
            // Already completed, go to dashboard
            router.push('/dashboard');
        }
    }, [userProfile, isProfileLoading, router]);

    const onSubmit = async (data: FormData) => {
        if (!userProfile) return;
        
        const profileData = {
            dateOfBirth: Timestamp.fromDate(new Date(data.dateOfBirth)),
            addressCity: data.addressCity,
            addressStreet: data.addressStreet,
            addressHouseNumber: data.addressHouseNumber,
            addressApartmentNumber: data.addressApartmentNumber,
            mobilePhone: data.mobilePhone,
            officePhone: data.officePhone,
            center: data.center,
            emergencyInfo: {
                team: data.emergencyTeam,
                role: data.emergencyRole,
            },
            isProfileComplete: true, // Mark profile as complete
        };

        try {
            await updateUser(userProfile.id, profileData);
            toast({
                title: "הפרופיל הושלם בהצלחה!",
                description: "חשבונך ממתין לאישור מנהל. תקבל הודעה במייל כשהחשבון יאושר.",
                duration: 10000,
            });
            await signOut(auth); // Log out the user to wait for approval
            router.push('/login');
        } catch (error) {
            console.error("Failed to update profile:", error);
            toast({ title: "שגיאה בעדכון הפרופיל", variant: "destructive" });
        }
    };

    if (isProfileLoading || !userProfile) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
    }
    
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
            <Card className="mx-auto max-w-2xl w-full shadow-lg border">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline">השלמת פרטים (שלב 2 מתוך 2)</CardTitle>
                    <CardDescription>
                        שלום {userProfile.firstName}, אנא מלא את הפרטים הבאים להשלמת ההרשמה. כל השדות הינם חובה.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="dateOfBirth">תאריך לידה</Label>
                                <Controller name="dateOfBirth" control={control} render={({ field }) => <Input id="dateOfBirth" type="date" {...field} />} />
                                {errors.dateOfBirth && <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>}
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="mobilePhone">טלפון נייד</Label>
                                <Controller name="mobilePhone" control={control} render={({ field }) => <Input id="mobilePhone" type="tel" dir="ltr" {...field} />} />
                                {errors.mobilePhone && <p className="text-xs text-destructive">{errors.mobilePhone.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                             <Label>כתובת מגורים</Label>
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="grid gap-2 col-span-2 sm:col-span-2">
                                    <Controller name="addressCity" control={control} render={({ field }) => <Input placeholder="עיר" {...field} />} />
                                    {errors.addressCity && <p className="text-xs text-destructive">{errors.addressCity.message}</p>}
                                </div>
                                <div className="grid gap-2 col-span-2 sm:col-span-2">
                                    <Controller name="addressStreet" control={control} render={({ field }) => <Input placeholder="רחוב" {...field} />} />
                                    {errors.addressStreet && <p className="text-xs text-destructive">{errors.addressStreet.message}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Controller name="addressHouseNumber" control={control} render={({ field }) => <Input placeholder="מס' בית" {...field} />} />
                                    {errors.addressHouseNumber && <p className="text-xs text-destructive">{errors.addressHouseNumber.message}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Controller name="addressApartmentNumber" control={control} render={({ field }) => <Input placeholder="דירה (0 אם אין)" {...field} />} />
                                    {errors.addressApartmentNumber && <p className="text-xs text-destructive">{errors.addressApartmentNumber.message}</p>}
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="grid gap-2">
                                <Label htmlFor="officePhone">טלפון במשרד (קווי)</Label>
                                <Controller name="officePhone" control={control} render={({ field }) => <Input id="officePhone" type="tel" dir="ltr" {...field} />} />
                                {errors.officePhone && <p className="text-xs text-destructive">{errors.officePhone.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="center">מרכז</Label>
                                <Controller
                                    name="center"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <SelectTrigger><SelectValue placeholder="בחר מרכז..." /></SelectTrigger>
                                            <SelectContent>
                                                {CENTERS.map(center => (
                                                    <SelectItem key={center} value={center}>{center}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.center && <p className="text-xs text-destructive">{errors.center.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>שיוך ותפקיד בחירום</Label>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Controller
                                        name="emergencyTeam"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                                <SelectTrigger><SelectValue placeholder="בחר צוות חירום..." /></SelectTrigger>
                                                <SelectContent>
                                                    {EMERGENCY_TEAMS.map(team => <SelectItem key={team} value={team}>{team}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.emergencyTeam && <p className="text-xs text-destructive">{errors.emergencyTeam.message}</p>}
                                </div>
                                 <div className="grid gap-2">
                                    <Controller
                                        name="emergencyRole"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                                <SelectTrigger><SelectValue placeholder="בחר תפקיד בחירום..." /></SelectTrigger>
                                                <SelectContent>
                                                    {EMERGENCY_ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.emergencyRole && <p className="text-xs text-destructive">{errors.emergencyRole.message}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isSubmitting} size="lg">
                                {isSubmitting && <Loader2 className="me-2 animate-spin" />}
                                שלח וסיים הרשמה
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
