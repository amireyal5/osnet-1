
"use client";

import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserProfile } from "@/hooks/use-user-profile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Loader2, Users } from "lucide-react";
import { useUsers } from "@/hooks/use-users";
import { useTeams } from "@/hooks/use-teams";
import { UserMultiSelect } from "@/components/admin/UserMultiSelect";

const formSchema = z.object({
  recipients: z.array(z.custom<UserProfile>()).min(1, "יש לבחור לפחות נמען אחד."),
  title: z.string().optional(),
  message: z.string().min(1, "הודעה לא יכולה להיות ריקה."),
}).refine(data => {
    if(data.recipients.length > 1) {
        return !!data.title && data.title.trim().length > 0;
    }
    return true;
}, {
    message: "יש לתת שם לקבוצה",
    path: ["title"],
});

type FormData = z.infer<typeof formSchema>;

interface SendNotificationFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onCreateThread: (recipients: UserProfile[], initialMessage: string, title?: string) => Promise<boolean>;
}

const ALL_EMPLOYEES_ID = 'all-employees-distribution-list';
const TEAM_DISTRIBUTION_PREFIX = 'team-distribution-list-';

export function SendNotificationForm({ isOpen, onOpenChange, onCreateThread }: SendNotificationFormProps) {
    const { users: allUsers, isLoading: areUsersLoading } = useUsers();
    const { teams } = useTeams();
    
    const { control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { recipients: [], message: "", title: "" },
    });

    const selectedRecipients = watch("recipients") || [];
    const isGroup = useMemo(() => selectedRecipients.length > 1, [selectedRecipients]);
    
    const selectableUsers = useMemo(() => {
        const allEmployeesDistributionList: UserProfile = {
            id: ALL_EMPLOYEES_ID,
            firstName: 'כל העובדים',
            lastName: '',
            email: 'רשימת תפוצה',
            roles: [],
            status: 'פעיל',
        };

        const teamDistributionLists: UserProfile[] = teams.map(team => ({
            id: `${TEAM_DISTRIBUTION_PREFIX}${team.id}`,
            firstName: team.name,
            lastName: '',
            email: 'רשימת תפוצה (צוות)',
            roles: [],
            status: 'פעיל',
        }));

        return [allEmployeesDistributionList, ...teamDistributionLists, ...allUsers];
    }, [allUsers, teams]);

    const handleRecipientsChange = (newSelection: UserProfile[]) => {
        const lastSelected = newSelection[newSelection.length - 1];
        let finalSelection = newSelection.filter(u => !u.id.startsWith(TEAM_DISTRIBUTION_PREFIX) && u.id !== ALL_EMPLOYEES_ID);

        const currentIds = new Set(finalSelection.map(u => u.id));

        if (lastSelected?.id === ALL_EMPLOYEES_ID) {
            finalSelection = [...allUsers];
        } else if (lastSelected?.id.startsWith(TEAM_DISTRIBUTION_PREFIX)) {
            const teamId = lastSelected.id.replace(TEAM_DISTRIBUTION_PREFIX, '');
            const team = teams.find(t => t.id === teamId);
            if (team) {
                team.memberIds.forEach(memberId => {
                    if (!currentIds.has(memberId)) {
                        const userToAdd = allUsers.find(u => u.id === memberId);
                        if (userToAdd) {
                            finalSelection.push(userToAdd);
                            currentIds.add(memberId);
                        }
                    }
                });
            }
        }
        
        setValue("recipients", finalSelection, { shouldValidate: true });
    };

    const onSubmit = async (data: FormData) => {
        const success = await onCreateThread(data.recipients, data.message, data.title);
        if(success) {
            onOpenChange(false);
            reset();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) reset(); onOpenChange(open); }}>
            <DialogContent className="sm:max-w-[525px]" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle>שיחה חדשה</DialogTitle>
                    <DialogDescription>בחר נמענים כדי להתחיל שיחה או ליצור קבוצה חדשה.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="recipients">אל:</Label>
                            <Controller
                                name="recipients"
                                control={control}
                                render={({ field }) => (
                                    <UserMultiSelect
                                        allUsers={selectableUsers}
                                        selectedUsers={field.value}
                                        onChange={handleRecipientsChange}
                                        placeholder="חפש והוסף נמענים..."
                                    />
                                )}
                            />
                            {errors.recipients && <p className="text-xs text-destructive">{errors.recipients.message}</p>}
                        </div>
                        {isGroup && (
                            <div className="grid gap-2">
                                <Label htmlFor="title">שם הקבוצה</Label>
                                <Controller name="title" control={control} render={({ field }) => <Input id="title" placeholder="לדוגמה: תכנון פרויקט" {...field} />} />
                                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="message">הודעה</Label>
                            <Controller name="message" control={control} render={({ field }) => <Textarea id="message" placeholder="כתוב את ההודעה שלך כאן..." {...field} />} />
                            {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                           <Button type="button" variant="outline">ביטול</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="me-2 animate-spin" />}
                            {isGroup ? "צור קבוצה" : "שלח"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
