
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MainLayout } from "@/components/main-layout";
import { useUsers } from "@/hooks/use-users";
import { useTeams } from "@/hooks/use-teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { USER_ROLES, UserProfile, CENTERS } from "@/hooks/use-user-profile";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  firstName: z.string().min(2, "שם פרטי הוא שדה חובה."),
  lastName: z.string().min(2, "שם משפחה הוא שדה חובה."),
  status: z.string(),
  roles: z.array(z.string()).min(1, "יש לבחור לפחות תפקיד אחד."),
  center: z.string().min(1, "יש לבחור מרכז."),
});

type FormData = z.infer<typeof formSchema>;

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    const { userId } = params;
    const { toast } = useToast();
    
    const { users, isLoading: areUsersLoading, updateUser } = useUsers();
    const { teams, isLoading: areTeamsLoading } = useTeams();
    
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isApproving, setIsApproving] = useState(false);


    const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting, dirtyFields } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            roles: [],
        }
    });

    useEffect(() => {
        if (users.length > 0 && userId) {
            const currentUser = users.find(u => u.id === userId);
            if (currentUser) {
                setUser(currentUser);
                reset({
                    firstName: currentUser.firstName,
                    lastName: currentUser.lastName,
                    status: currentUser.status,
                    roles: Array.isArray(currentUser.roles) ? currentUser.roles : [],
                    center: currentUser.center || "", // Set to empty string if not defined
                });
            } else {
                 router.push('/admin/users');
            }
        }
    }, [userId, users, reset, router]);

    const onSubmit = async (data: FormData) => {
        if (!userId) return;
        const hasChanges = Object.keys(dirtyFields).length > 0;

        if (hasChanges) {
             try {
                await updateUser(userId as string, data);
                toast({ title: "משתמש עודכן בהצלחה" });
                router.push('/admin/users');
            } catch (error) {
                console.error("Failed to update user:", error);
                toast({ title: "שגיאה בעדכון משתמש", variant: "destructive" });
            }
        } else {
            router.push('/admin/users');
        }
    };
    
    const handleApproveAndSendEmail = handleSubmit(async (data) => {
        if (!userId || !user) return;
        setIsApproving(true);
        const hasFormChanges = Object.keys(dirtyFields).length > 0;
        
        try {
            // Step 1: Save any form changes first (roles, team, etc.)
            if (hasFormChanges) {
                await updateUser(userId as string, data);
                toast({ title: "שינויים נשמרו בהצלחה" });
            }

            // Step 2: Approve the user by updating status and roles
            const newRoles = data.roles.filter(role => role !== USER_ROLES.PENDING);
            if (!newRoles.includes(USER_ROLES.EMPLOYEE)) {
                newRoles.push(USER_ROLES.EMPLOYEE);
            }
            await updateUser(userId as string, { status: 'פעיל', roles: newRoles });
            toast({ title: "משתמש אושר בהצלחה!", description: "שולח מייל קבלת פנים..." });

            // Step 3: Send the welcome email via the new API route
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: user.email,
                    name: data.firstName,
                    subject: 'ברוך הבא ל-עו"סנט!',
                    template: 'welcome',
                }),
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Failed to send welcome email.');
            }

            toast({ title: "מייל קבלת פנים נשלח!", variant: "default" });

            router.push('/admin/users');

        } catch (error: any) {
            console.error("Failed during approval process:", error);
            toast({ 
                title: "אירעה שגיאה בתהליך האישור", 
                description: `התהליך נעצר. שגיאה: ${error.message}`, 
                variant: "destructive",
                duration: 10000
            });
        } finally {
            setIsApproving(false);
        }
    });
    
    if (areUsersLoading || areTeamsLoading || !user) {
         return <MainLayout><div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" size={48} /></div></MainLayout>
    }

    return (
        <MainLayout>
            <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                 <Button variant="ghost" onClick={() => router.push('/admin/users')} className="self-start">
                    <ArrowRight className="me-2 h-4 w-4" />
                    חזור לרשימת המשתמשים
                </Button>
                
                <Card>
                    <CardHeader>
                        <CardTitle>עריכת משתמש</CardTitle>
                        <CardDescription>עדכן את הפרטים וההרשאות של {user.firstName} {user.lastName}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
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

                            <div className="grid gap-2">
                                <Label htmlFor="status">סטטוס משתמש</Label>
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl" disabled>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="פעיל">פעיל</SelectItem>
                                                <SelectItem value="ממתין לאישור">ממתין לאישור</SelectItem>
                                                <SelectItem value="מושבת">מושבת</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                 <p className="text-xs text-muted-foreground">סטטוס המשתמש משתנה אוטומטית בעת פעולת האישור.</p>
                            </div>
                            
                            <div className="grid gap-2">
                                <Label>תפקידים</Label>
                                <Controller 
                                    name="roles"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="p-4 border rounded-md grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {Object.values(USER_ROLES).filter(r => r !== 'בהמתנה').map(role => (
                                                <div key={role} className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={`role-${role}`}
                                                        checked={field.value?.includes(role)}
                                                        onCheckedChange={(checked) => {
                                                            const currentRoles = field.value || [];
                                                            if (checked) {
                                                                field.onChange([...currentRoles, role]);
                                                            } else {
                                                                field.onChange(currentRoles.filter(value => value !== role));
                                                            }
                                                        }}
                                                    />
                                                    <Label htmlFor={`role-${role}`} className="font-normal">{role}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                />
                                {errors.roles && <p className="text-xs text-destructive">{errors.roles.message}</p>}
                            </div>

                            <div className="flex justify-end gap-2">
                                {user.status !== "ממתין לאישור" ? (
                                    <>
                                        <Button type="button" variant="outline" onClick={() => router.push('/admin/users')}>ביטול</Button>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="me-2 animate-spin" />}
                                            שמור שינויים
                                        </Button>
                                    </>
                                ) : (
                                    <Button type="button" onClick={handleApproveAndSendEmail} disabled={isApproving}>
                                        {isApproving && <Loader2 className="me-2 animate-spin" />}
                                        אשר ושלח מייל
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
