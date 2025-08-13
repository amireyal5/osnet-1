
"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Unit, useUnits } from "@/hooks/use-units";
import { Textarea } from "@/components/ui/textarea";
import { useUsers } from "@/hooks/use-users";
import { UserMultiSelect } from "@/components/admin/UserMultiSelect";
import { UserProfile } from "@/hooks/use-user-profile";

const formSchema = z.object({
  name: z.string().min(2, "שם היחידה חייב להכיל לפחות 2 תווים."),
  specialtyDescription: z.string().optional(),
  coordinator: z.array(z.custom<UserProfile>()).max(1, "ניתן לבחור רכז יחידה אחד בלבד.").optional(),
  members: z.array(z.custom<UserProfile>()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface UnitFormProps {
    isOpen: boolean;
    onClose: () => void;
    unit: Unit | null;
}

export function UnitForm({ isOpen, onClose, unit }: UnitFormProps) {
    const { toast } = useToast();
    const { createUnit, updateUnit } = useUnits();
    const { users, isLoading: areUsersLoading } = useUsers();

    const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            specialtyDescription: "",
            coordinator: [],
            members: [],
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (unit && users.length > 0) {
                const coordinatorUser = users.find(u => u.id === unit.coordinatorId);
                const memberUsers = users.filter(u => unit.memberIds?.includes(u.id));
                reset({
                    name: unit.name,
                    specialtyDescription: unit.specialtyDescription || "",
                    coordinator: coordinatorUser ? [coordinatorUser] : [],
                    members: memberUsers || [],
                });
            } else {
                reset({
                    name: "",
                    specialtyDescription: "",
                    coordinator: [],
                    members: [],
                });
            }
        }
    }, [unit, reset, isOpen, users]);

    const onSubmit = async (data: FormData) => {
        try {
            const coordinator = data.coordinator?.[0];
            const memberIds = data.members?.map(m => m.id) || [];

            const finalData = {
                name: data.name,
                specialtyDescription: data.specialtyDescription,
                coordinatorId: coordinator?.id || null,
                memberIds: memberIds,
            };

            if (unit) {
                await updateUnit(unit.id, finalData);
                toast({ title: "יחידה עודכנה בהצלחה" });
            } else {
                await createUnit(finalData);
                toast({ title: "יחידה נוצרה בהצלחה" });
            }
            onClose();
        } catch (error) {
            console.error("Failed to save unit:", error);
            toast({ title: "שגיאה בשמירת היחידה", variant: "destructive" });
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent dir="rtl" className="sm:max-w-[525px]">
                <DialogHeader className="text-right">
                    <DialogTitle>{unit ? 'עריכת יחידה' : 'יצירת יחידה חדשה'}</DialogTitle>
                    <DialogDescription>
                        {unit ? `ערוך את פרטי היחידה "${unit.name}"` : 'מלא את הפרטים ליצירת יחידה חדשה.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                     <div className="grid gap-2">
                        <Label htmlFor="name">שם היחידה</Label>
                        <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} />} />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="specialtyDescription">תיאור התמחות (אופציונלי)</Label>
                        <Controller name="specialtyDescription" control={control} render={({ field }) => <Textarea id="specialtyDescription" {...field} />} />
                        {errors.specialtyDescription && <p className="text-xs text-destructive">{errors.specialtyDescription.message}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="coordinator">רכז היחידה (אופציונלי)</Label>
                         <Controller
                            name="coordinator"
                            control={control}
                            render={({ field }) => (
                                <UserMultiSelect
                                    allUsers={users}
                                    selectedUsers={field.value || []}
                                    onChange={field.onChange}
                                    placeholder="בחר רכז יחידה..."
                                    maxSelection={1}
                                />
                            )}
                        />
                        {errors.coordinator && <p className="text-xs text-destructive">{errors.coordinator.message}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="members">עובדי היחידה (אופציונלי)</Label>
                        <Controller
                            name="members"
                            control={control}
                            render={({ field }) => (
                               <UserMultiSelect
                                    allUsers={users}
                                    selectedUsers={field.value || []}
                                    onChange={field.onChange}
                                    placeholder="חפש והוסף עובדים ליחידה..."
                                />
                            )}
                        />
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">ביטול</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="animate-spin me-2" />}
                            שמור שינויים
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
