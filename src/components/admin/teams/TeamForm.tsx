
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
import { useUsers } from "@/hooks/use-users";
import { Team, useTeams } from "@/hooks/use-teams";
import { UserMultiSelect } from "@/components/admin/UserMultiSelect";
import { USER_ROLES, UserProfile } from "@/hooks/use-user-profile";

const formSchema = z.object({
  name: z.string().min(2, "שם הצוות חייב להכיל לפחות 2 תווים."),
  teamLead: z.array(z.custom<UserProfile>()).max(1, "ניתן לבחור ראש צוות אחד בלבד.").optional(),
  members: z.array(z.custom<UserProfile>()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TeamFormProps {
    isOpen: boolean;
    onClose: () => void;
    team: Team | null;
}

export function TeamForm({ isOpen, onClose, team }: TeamFormProps) {
    const { toast } = useToast();
    const { users, isLoading: areUsersLoading } = useUsers();
    const { createTeam, updateTeam } = useTeams();
    
    const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            teamLead: [],
            members: []
        }
    });

    const selectedMembers = watch('members') || [];

    const potentialTeamLeads = useMemo(() => {
        // Safe check for user.roles
        return users.filter(user => Array.isArray(user.roles) && user.roles.includes(USER_ROLES.TEAM_LEAD));
    }, [users]);
    
    useEffect(() => {
        if (isOpen) {
            if (team && users.length > 0) {
                const leadUser = users.find(u => u.id === team.teamLeadId);
                const memberUsers = users.filter(u => team.memberIds.includes(u.id));
                reset({
                    name: team.name,
                    teamLead: leadUser ? [leadUser] : [],
                    members: memberUsers || [],
                });
            } else {
                reset({
                    name: "",
                    teamLead: [],
                    members: [],
                });
            }
        }
    }, [team, reset, isOpen, users]);

    const onSubmit = async (data: FormData) => {
        try {
            const teamLead = data.teamLead?.[0];
            const memberIds = data.members?.map(m => m.id) || [];
            
            // If a team lead is selected, ensure they are also a member
            if (teamLead && !memberIds.includes(teamLead.id)) {
                memberIds.push(teamLead.id);
            }

            const finalData = {
                name: data.name,
                teamLeadId: teamLead?.id || null,
                memberIds: memberIds,
            };

            if (team) {
                await updateTeam(team.id, finalData);
                toast({ title: "צוות עודכן בהצלחה" });
            } else {
                await createTeam(finalData);
                toast({ title: "צוות נוצר בהצלחה" });
            }
            onClose();
        } catch (error) {
            console.error("Failed to save team:", error);
            toast({ title: "שגיאה בשמירת הצוות", variant: "destructive" });
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle>{team ? 'עריכת צוות' : 'יצירת צוות חדש'}</DialogTitle>
                    <DialogDescription>
                        {team ? `ערוך את פרטי הצוות "${team.name}"` : 'מלא את הפרטים ליצירת צוות חדש.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                     <div className="grid gap-2">
                        <Label htmlFor="name">שם הצוות</Label>
                        <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} />} />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="teamLeadId">ראש צוות (אופציונלי)</Label>
                        <Controller
                            name="teamLead"
                            control={control}
                            render={({ field }) => (
                                <UserMultiSelect
                                    allUsers={potentialTeamLeads}
                                    selectedUsers={field.value || []}
                                    onChange={field.onChange}
                                    placeholder="בחר ראש צוות..."
                                    maxSelection={1}
                                />
                            )}
                        />
                        {errors.teamLead && <p className="text-xs text-destructive">{errors.teamLead.message}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="memberIds">חברי צוות (אופציונלי)</Label>
                        <Controller
                            name="members"
                            control={control}
                            render={({ field }) => (
                               <UserMultiSelect
                                    allUsers={users}
                                    selectedUsers={field.value || []}
                                    onChange={field.onChange}
                                    placeholder="חפש והוסף חברי צוות..."
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
