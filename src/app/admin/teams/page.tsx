
"use client";

import { MainLayout } from "@/components/main-layout";
import { useAuthCheck } from "@/hooks/use-auth-check";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { TeamsTable } from "@/components/admin/teams/TeamsTable";
import { TeamForm } from "@/components/admin/teams/TeamForm";
import { useState } from "react";
import { useTeams, Team } from "@/hooks/use-teams";


export default function TeamsPage() {
    useAuthCheck();
    const { userProfile, isLoading: isProfileLoading } = useUserProfile();
    const { teams, isLoading: areTeamsLoading } = useTeams();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);

    const handleEdit = (team: Team) => {
        setEditingTeam(team);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingTeam(null);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setEditingTeam(null);
        setIsFormOpen(false);
    }
    
    const isLoading = isProfileLoading || areTeamsLoading;

    // Only General Manager or Admin can manage teams
    const canManageTeams = userProfile && userProfile.roles.some(r => ['ראש מנהל', 'מנהל מערכת'].includes(r));

    if (isLoading) {
        return <MainLayout><div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" size={48} /></div></MainLayout>
    }

    if (!canManageTeams) {
         return <MainLayout><div className="text-center text-destructive">אין לך הרשאה לגשת לדף זה.</div></MainLayout>
    }

    return (
        <MainLayout>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-headline tracking-tight">ניהול צוותים</h1>
                        <p className="text-muted-foreground">
                            צור ונהל את הצוותים בארגון.
                        </p>
                    </div>
                    <Button onClick={handleAddNew}>
                        <PlusCircle className="me-2 h-4 w-4" />
                        צור צוות חדש
                    </Button>
                </div>

                <TeamsTable teams={teams} onEdit={handleEdit} />

                <TeamForm 
                    isOpen={isFormOpen}
                    onClose={handleCloseForm}
                    team={editingTeam}
                />
            </div>
        </MainLayout>
    );
}
