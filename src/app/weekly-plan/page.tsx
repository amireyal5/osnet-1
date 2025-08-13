
"use client";

import { Suspense, useEffect } from "react";
import { format, subDays, addDays } from "date-fns";
import { he } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, BrainCircuit, RotateCcw, AlertCircle } from "lucide-react";

import { MainLayout } from "@/components/main-layout";
import { Button } from "@/components/ui/button";
import { useWeeklyPlan } from "@/hooks/use-weekly-plan";
import { EditableWeeklyPlanVisualizer } from "@/components/weekly-plan/EditableWeeklyPlanVisualizer";

function WeeklyPlanContent() {
  const planHook = useWeeklyPlan();

  const {
    isLoading: isPlanLoading, 
    currentDate, 
    setCurrentDate,
    weekStart,
    weekEnd,
    isSaving,
    isDirty,
    saveError,
    retrySave,
    undo,
    redo,
    canUndo,
    canRedo,
    autofillPlan,
   } = planHook;

   useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            undo();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            redo();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
   }, [undo, redo]);

  const handlePrevWeek = () => setCurrentDate(prev => subDays(prev, 7));
  const handleNextWeek = () => setCurrentDate(prev => addDays(prev, 7));

  const getSavingStatusText = () => {
    if (saveError) {
      return (
        <div className="flex items-center gap-2 text-destructive">
            <AlertCircle size={16} />
            <span>שגיאת שמירה</span>
            <Button onClick={retrySave} size="sm" variant="destructive" className="me-2">
                <RotateCcw size={14} className="me-1" />
                נסה שוב
            </Button>
        </div>
      )
    }
    if (isSaving) return <><Loader2 className="animate-spin me-2" size={16} /><span>שומר...</span></>;
    if (isDirty) return <span>שינויים לא שמורים</span>;
    return <span className="text-green-600">כל השינויים נשמרו</span>;
  }

  if (isPlanLoading) {
    return <MainLayout><div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" size={48} /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 h-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold font-headline tracking-tight">תוכנית עבודה שבועית</h1>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-semibold text-muted-foreground text-center">
                  {format(weekStart, 'd MMMM', { locale: he })} - {format(weekEnd, 'd MMMM yyyy', { locale: he })}
                </h2>
                <Button variant="ghost" size="icon" onClick={handleNextWeek}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                 <div className="text-sm text-muted-foreground flex items-center">{getSavingStatusText()}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={undo} disabled={!canUndo} variant="outline">Undo</Button>
                <Button onClick={redo} disabled={!canRedo} variant="outline">Redo</Button>
                <Button variant="outline" className="bg-orange-500 text-white hover:bg-orange-600 hover:text-white" onClick={autofillPlan}>
                    <BrainCircuit className="me-2" />
                    מילוי אוטומטי
                </Button>
            </div>
          </div>

          <div className="flex-1">
            <EditableWeeklyPlanVisualizer 
                planHook={planHook}
            />
          </div>
      </div>
    </MainLayout>
  );
}


export default function WeeklyPlanPage() {
    return (
        <Suspense fallback={<MainLayout><div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" size={48} /></div></MainLayout>}>
            <WeeklyPlanContent />
        </Suspense>
    )
}
