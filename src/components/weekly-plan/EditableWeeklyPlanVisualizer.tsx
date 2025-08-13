
"use client";

import { format } from "date-fns";
import { he } from "date-fns/locale";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { cn } from "@/lib/utils";
import { useWeeklyPlan } from "@/hooks/use-weekly-plan";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { DayCard } from "./DayCard";
import { ActivityEditor } from "./ActivityEditor";

type PlanHookType = ReturnType<typeof useWeeklyPlan>;

interface EditableWeeklyPlanVisualizerProps {
  planHook: PlanHookType;
}

export const EditableWeeklyPlanVisualizer = ({ planHook }: EditableWeeklyPlanVisualizerProps) => {
    const { weeklyPlan, workDays, editingDayKey, setEditingDayKey, updateDayPlan } = planHook;

    const closeEditor = () => {
        setEditingDayKey(null);
    }

    if (!weeklyPlan) return <p className="text-center text-muted-foreground">לא נמצאה תוכנית לשבוע זה.</p>;

    return (
        <div className="relative">
             <LayoutGroup>
                <div className="flex justify-between items-start gap-4 flex-wrap">
                    {workDays.map(dayKey => {
                        const dayPlan = weeklyPlan[dayKey];
                        return (
                            <DayCard 
                                key={dayKey}
                                dayKey={dayKey}
                                dayPlan={dayPlan}
                                onClick={() => setEditingDayKey(dayKey)}
                                className={cn(editingDayKey === dayKey ? 'ring-2 ring-primary' : 'hover:shadow-xl hover:ring-2 hover:ring-primary/50')}
                            />
                        )
                    })}
                </div>
            
                <AnimatePresence>
                {editingDayKey && weeklyPlan[editingDayKey] && (
                     <motion.div
                        layoutId={`card-${editingDayKey}`}
                        className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4"
                        onClick={closeEditor}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            layout
                            className="relative w-full max-w-md bg-background rounded-xl overflow-y-auto max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                             <div className="p-4 border-b text-center relative">
                                <h2 className="text-xl font-bold font-headline">{format(new Date(editingDayKey), "EEEE, dd MMMM", { locale: he })}</h2>
                                <Button variant="ghost" size="icon" className="absolute top-2 left-2" onClick={closeEditor}>
                                    <X />
                                </Button>
                             </div>
                             <ActivityEditor
                                dayKey={editingDayKey}
                                dayPlan={weeklyPlan[editingDayKey]}
                                onDayPlanChange={updateDayPlan}
                                closeEditor={closeEditor}
                             />
                        </motion.div>
                    </motion.div>
                )}
                </AnimatePresence>
            </LayoutGroup>
        </div>
    );
};
