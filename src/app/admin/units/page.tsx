
"use client";

import { MainLayout } from "@/components/main-layout";
import { useAuthCheck } from "@/hooks/use-auth-check";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useUnits, Unit } from "@/hooks/use-units";
import { UnitsTable } from "@/components/admin/units/UnitsTable";
import { UnitForm } from "@/components/admin/units/UnitForm";


export default function UnitsPage() {
    useAuthCheck();
    const { userProfile, isLoading: isProfileLoading } = useUserProfile();
    const { units, isLoading: areUnitsLoading } = useUnits();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

    const handleEdit = (unit: Unit) => {
        setEditingUnit(unit);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingUnit(null);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setEditingUnit(null);
        setIsFormOpen(false);
    }
    
    const isLoading = isProfileLoading || areUnitsLoading;

    // Only General Manager or Admin can manage units
    const canManageUnits = userProfile && userProfile.roles.some(r => ['ראש מנהל', 'מנהל מערכת'].includes(r));

    if (isLoading) {
        return <MainLayout><div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" size={48} /></div></MainLayout>
    }

    if (!canManageUnits) {
         return <MainLayout><div className="text-center text-destructive">אין לך הרשאה לגשת לדף זה.</div></MainLayout>
    }

    return (
        <MainLayout>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-headline tracking-tight">ניהול יחידות</h1>
                        <p className="text-muted-foreground">
                            צור ונהל את היחידות המקצועיות בארגון.
                        </p>
                    </div>
                    <Button onClick={handleAddNew}>
                        <PlusCircle className="me-2 h-4 w-4" />
                        צור יחידה חדשה
                    </Button>
                </div>

                <UnitsTable units={units} onEdit={handleEdit} />

                <UnitForm 
                    isOpen={isFormOpen}
                    onClose={handleCloseForm}
                    unit={editingUnit}
                />
            </div>
        </MainLayout>
    );
}

