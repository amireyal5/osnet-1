
"use client";

import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserProfile } from "@/hooks/use-user-profile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Loader2 } from "lucide-react";
import { useUsers } from "@/hooks/use-users";
import { useTeams } from "@/hooks/use-teams";
import { UserMultiSelect } from "@/components/admin/UserMultiSelect";
import { Survey } from "@/types";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  recipients: z.array(z.custom<UserProfile>()).min(1, "יש לבחור לפחות נמען אחד."),
});

type FormData = z.infer<typeof formSchema>;

interface ShareSurveyDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    survey: Survey;
}

const ALL_EMPLOYEES_ID = 'all-employees-distribution-list';
const TEAM_DISTRIBUTION_PREFIX = 'team-distribution-list-';

export function ShareSurveyDialog({ isOpen, onOpenChange, survey }: ShareSurveyDialogProps) {
    const { users: allUsers } = useUsers();
    const { teams } = useTeams();
    const { handleCreateThread } = useNotifications();
    const { toast } = useToast();
    const router = useRouter();

    const { control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { recipients: [] },
    });

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


    const isGroup = (recipients: UserProfile[]) => recipients.length > 1;

    const onSubmit = async (data: FormData) => {
        const surveyLink = `https://osnet.netlify.app/surveys/${survey.id}`;
        const initialMessage = `שלום, הנך מוזמן/ת למלא את הסקר "${survey.title}".\n<a href="${surveyLink}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">תוכל/י לגשת אליו בקישור הבא</a>.`;
        const threadTitle = isGroup(data.recipients) ? `סקר: ${survey.title}` : undefined;

        const success = await handleCreateThread(data.recipients, initialMessage, threadTitle);
        if(success) {
            toast({ title: "הסקר שותף בהצלחה!" });
            onOpenChange(false);
            reset();
            router.push('/surveys');
        } else {
             toast({ title: "שגיאה בשיתוף הסקר", variant: "destructive" });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) reset(); onOpenChange(open); }}>
            <DialogContent className="sm:max-w-[525px]" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle>שתף סקר</DialogTitle>
                    <DialogDescription>בחר למי לשלוח הודעה עם קישור לסקר "{survey.title}".</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="recipients">נמענים:</Label>
                            <Controller
                                name="recipients"
                                control={control}
                                render={({ field }) => (
                                    <UserMultiSelect
                                        allUsers={selectableUsers}
                                        selectedUsers={field.value || []}
                                        onChange={handleRecipientsChange}
                                        placeholder="חפש והוסף נמענים..."
                                    />
                                )}
                            />
                            {errors.recipients && <p className="text-xs text-destructive">{errors.recipients.message}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                           <Button type="button" variant="outline">ביטול</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="me-2 animate-spin" />}
                            שלח הזמנה
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
