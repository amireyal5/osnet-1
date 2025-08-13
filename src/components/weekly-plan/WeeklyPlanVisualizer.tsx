
"use client"

import { useMemo } from 'react';
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { motion } from "framer-motion";
import { WeeklyPlan, Activity } from '@/types/weekly-plan';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { activityDetails } from '@/types/weekly-plan';
import { DayCard } from './DayCard';

interface WeeklyPlanVisualizerProps {
  weeklyPlan: WeeklyPlan;
  onDayClick?: (dayKey: string) => void;
  highlightDay?: string | null;
}

const getActivityTimeText = (activity: Activity) => {
    const details = activityDetails[activity.type];
    if (activity.isAllDay || (details && details.isAllDay)) {
      return "יום שלם";
    }
    if (activity.noReturn) {
      return `${activity.startTime} - יציאה`;
    }
    if (activity.startTime && activity.endTime) {
      return `${activity.startTime} - ${activity.endTime}`;
    }
    return "";
};

export const WeeklyPlanVisualizer = ({ weeklyPlan, onDayClick, highlightDay }: WeeklyPlanVisualizerProps) => {
  const workDays = useMemo(() => Object.keys(weeklyPlan).sort(), [weeklyPlan]);

  return (
    <TooltipProvider>
      <div className="flex flex-wrap justify-center gap-2">
        {workDays.map((dayKey, index) => {
          const dayPlan = weeklyPlan[dayKey];
          const isClickable = !!onDayClick;

          return (
            <Tooltip key={dayKey}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-full max-w-[200px] sm:w-1/3 md:w-1/4 lg:w-1/5 flex-grow"
                >
                    <DayCard
                        dayKey={dayKey}
                        dayPlan={dayPlan}
                        onClick={isClickable ? () => onDayClick(dayKey) : undefined}
                        className={cn(
                            isClickable && "cursor-pointer hover:scale-105 hover:shadow-lg",
                            highlightDay === dayKey && "ring-2 ring-primary ring-offset-2"
                        )}
                    />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p className='font-bold'>{format(new Date(dayKey), "EEEE, dd/MM", { locale: he })}</p>
                {dayPlan.activities.map((activity, i) => (
                    <p key={i} className="text-sm">
                      {activity.type === 'אחר' ? activity.description || 'אחר' : activity.type}
                      <span className='text-muted-foreground text-xs ms-2'>({getActivityTimeText(activity)})</span>
                    </p>
                ))}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
