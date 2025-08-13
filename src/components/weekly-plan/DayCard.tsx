
"use client";

import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DayPlan, Activity, activityColorMap, activityDetails } from "@/types/weekly-plan";
import { Card, CardContent } from "@/components/ui/card";

interface DayCardProps {
    dayKey: string;
    dayPlan: DayPlan;
    onClick?: () => void;
    className?: string;
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

export const DayCard = ({ dayKey, dayPlan, onClick, className }: DayCardProps) => {
    const isPlaceholder = dayPlan.activities.length === 1 && dayPlan.activities[0].type === 'נא למלא';

    return (
        <div onClick={onClick} className={cn("flex-1 min-w-[150px]", onClick ? "cursor-pointer" : "")}>
            <Card className={cn("w-full h-40 rounded-lg shadow-md transition-all duration-300 overflow-hidden", className, isPlaceholder && 'bg-slate-50 border-dashed')}>
                <CardContent className="p-0 h-full flex flex-col">
                    <div className={cn("flex flex-col items-center p-2 border-b", isPlaceholder ? 'bg-slate-100' : 'bg-background')}>
                        <h3 className="font-bold font-headline">{format(new Date(dayKey), "EEEE", { locale: he })}</h3>
                        <p className="text-xs text-muted-foreground">{format(new Date(dayKey), "dd/MM")}</p>
                    </div>
                    <div className="flex-grow flex flex-col">
                        {dayPlan.activities.map((activity, index) => {
                            const activityColors = activityColorMap[activity.type] || activityColorMap['אחר'];
                            const timeText = getActivityTimeText(activity);
                            return (
                                <div key={index} className={cn("w-full flex-1 flex flex-col justify-center items-center p-1 text-center", activityColors.background, activityColors.text)}>
                                    <p className="text-sm font-bold truncate max-w-full">{activity.type === 'אחר' ? activity.description || 'אחר' : activity.type}</p>
                                    <p className="text-xs leading-tight mt-1">{timeText}</p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
