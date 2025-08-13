
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile, EMERGENCY_TEAMS, EMERGENCY_ROLES, CENTERS, Center, EmergencyTeam, EmergencyRole } from "@/hooks/use-user-profile";
import { useUsers } from "@/hooks/use-users";
import { Timestamp } from "firebase/firestore";
import { MainLayout } from "@/components/main-layout";
import { format } from 'date-fns';

const israelPhoneRegex = /^(05\d|0[2-4,6-9,77,73,72])(-?\d){7}$/;

const formSchema = z.object({
  firstName: z.string().min(2, "שם פרטי הוא שדה חובה."),
  lastName: z.string().min(2, "שם משפחה הוא שדה חובה."),
  dateOfBirth: z.string().min(1, "תאריך לידה הוא שדה חובה."),
  addressCity: z.string().min(2, "שם עיר הוא שדה חובה."),
  addressStreet: z.string().min(2, "שם רחוב הוא שדה חובה."),
  addressHouseNumber: z.string().min(1, "מספר בית הוא שדה חובה."),
  addressApartmentNumber: z.string().min(1, "מספר דירה הוא שדה חובה (יש למלא 0 אם אין)."),
  mobilePhone: z.string().regex(israelPhoneRegex, "מספר טלפון נייד לא תקין."),
  officePhone: z.string().regex(israelPhoneRegex, "מספר טלפון קווי לא תקין."),
  center: z.enum(CENTERS, { required_error: "שיוך למרכז הוא שדה חובה." }),
  emergencyTeam: z.enum(EMERGENCY_TEAMS),
  emergencyRole: z.enum(EMERGENCY_ROLES),
});

type FormData = z.infer<typeof formSchema>;

const formatTimestampForInput = (timestamp?: Timestamp | null) => {
    if (!timestamp) return "";
    return format(timestamp.toDate(), "yyyy-MM-dd");
};

export default function ProfilePage() {
    const router = useRouter();
    const { toast } = useToast();
    const { userProfile, isLoading: isProfileLoading } = useUserProfile();
    const { updateUser } = useUsers();

    const { control, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            addressCity: '',
            addressStreet: '',
            addressHouseNumber: '',
            addressApartmentNumber: '',
            mobilePhone: '',
            officePhone: '',
            center: undefined,
            emergencyTeam: undefined,
            emergencyRole: undefined,
        }
    });
    
    useEffect(() => {
        if(userProfile) {
            reset({
                firstName: userProfile.firstName || '',
                lastName: userProfile.lastName || '',
                dateOfBirth: formatTimestampForInput(userProfile.dateOfBirth),
                addressCity: userProfile.addressCity || '',
                addressStreet: userProfile.addressStreet || '',
                addressHouseNumber: userProfile.addressHouseNumber || '',
                addressApartmentNumber: userProfile.addressApartmentNumber || '',
                mobilePhone: userProfile.mobilePhone || '',
                officePhone: userProfile.officePhone || '',
                center: userProfile.center,
                emergencyTeam: userProfile.emergencyInfo?.team,
                emergencyRole: userProfile.emergencyInfo?.role,
            });
        }
    }, [userProfile, reset]);

    const onSubmit = async (data: FormData) => {
        if (!userProfile) return;
        
        const profileData = {
            firstName: data.firstName,
            lastName: data.lastName,
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
            isProfileComplete: true,
        };

        try {
            await updateUser(userProfile.id, profileData);
            toast({ title: "הפרופיל עודכן בהצלחה!" });
            if (userProfile.isProfileComplete === false) {
                router.push('/dashboard');
            }
        } catch (error) {
            console.error("Failed to update profile:", error);
            toast({ title: "שגיאה בעדכון הפרופיל", variant: "destructive" });
        }
    };
    
    if (isProfileLoading || !userProfile) {
        return <MainLayout><div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div></MainLayout>;
    }

    return (
        <MainLayout>
             <div className="max-w-3xl mx-auto flex flex-col gap-6">
                 {userProfile.isProfileComplete && (
                    <Button variant="ghost" onClick={() => router.push('/dashboard')} className="self-start">
                        <ArrowRight className="me-2 h-4 w-4" />
                        חזור לדשבורד
                    </Button>
                 )}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-headline">הפרופיל שלי</CardTitle>
                        <CardDescription>
                            עדכן כאן את הפרטים האישיים ופרטי החירום שלך.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="firstName">שם פרטי</Label>
                                    <Controller name="firstName" control={control} render={({ field }) => <Input id="firstName" {...field} />} />
                                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="lastName">שם משפחה</Label>
                                    <Controller name="lastName" control={control} render={({ field }) => <Input id="lastName" {...field} />} />
                                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                                </div>
                            </div>
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
                                <Button type="submit" disabled={isSubmitting || !isDirty} size="lg">
                                    {isSubmitting && <Loader2 className="me-2 animate-spin" />}
                                    שמור שינויים
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
