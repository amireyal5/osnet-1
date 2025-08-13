
"use client";

import { Activity, ActivityType, DayPlan, activityDetails, activityTypes } from "@/types/weekly-plan";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";

interface ActivityEditorProps {
    dayKey: string;
    dayPlan: DayPlan;
    onDayPlanChange: (dayKey: string, newDayPlan: DayPlan) => void;
    closeEditor: () => void;
}

export const ActivityEditor = ({ dayKey, dayPlan, onDayPlanChange, closeEditor }: ActivityEditorProps) => {

    const handleActivityChange = (index: number, updatedActivity: Activity) => {
        const newDayPlan = { ...dayPlan };
        let newActivities = [...newDayPlan.activities];

        const details = activityDetails[updatedActivity.type];
        const isNowAllDay = updatedActivity.isAllDay || details?.isAllDay;
        
        if (isNowAllDay) {
            newActivities = [{ ...updatedActivity, isAllDay: true, startTime: '', endTime: '', noReturn: false }];
            onDayPlanChange(dayKey, { ...newDayPlan, activities: newActivities });
            closeEditor();
            return;
        }

        newActivities[index] = updatedActivity;
        
        onDayPlanChange(dayKey, { ...newDayPlan, activities: newActivities });
    };

    const handleAddActivity = () => {
        const lastActivity = dayPlan.activities[dayPlan.activities.length - 1];
        const newStartTime = lastActivity?.endTime || '';
        const newActivities = [...dayPlan.activities, { type: 'בחר פעילות', isAllDay: false, startTime: newStartTime, endTime: '' }];
        onDayPlanChange(dayKey, { ...dayPlan, activities: newActivities });
    };

    const handleRemoveActivity = (index: number) => {
        const newActivities = dayPlan.activities.filter((_, i) => i !== index);
        if (newActivities.length === 0) {
            newActivities.push({ type: 'נא למלא', isAllDay: true });
        }
        onDayPlanChange(dayKey, { ...dayPlan, activities: newActivities });
    };

    const canAddActivity = () => {
        if (dayPlan.activities.length >= 3) return false;
        const hasAllDay = dayPlan.activities.some(a => a.isAllDay || activityDetails[a.type]?.isAllDay);
        if (hasAllDay) return false;
        const hasNoReturn = dayPlan.activities.some(a => a.noReturn);
        if (hasNoReturn) return false;
        return true;
    }

    const handleTimeBlur = (e: React.FocusEvent<HTMLInputElement>, index: number, field: 'startTime' | 'endTime') => {
        const value = e.target.value;
        if (value && value.includes(':') && value.split(':')[1].length === 0) {
             const newTime = `${value.split(':')[0]}:00`;
             const newActivity = { ...dayPlan.activities[index], [field]: newTime };
             handleActivityChange(index, newActivity);
        } else if (value && !value.includes(':') && value.length > 0) {
            const newTime = `${value.padStart(2, '0')}:00`;
             const newActivity = { ...dayPlan.activities[index], [field]: newTime };
             handleActivityChange(index, newActivity);
        }
    };


    return (
        <motion.div 
            layout="position"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 space-y-4"
        >
            {dayPlan.activities.map((activity, index) => {
                const details = activityDetails[activity.type];
                const isEffectivelyAllDay = !!activity.isAllDay || !!details?.isAllDay;
                
                return (
                    <Card key={index} className="bg-muted/50 p-4 grid gap-4">
                        <div className="flex items-center justify-between">
                            <Select 
                                value={activity.type} 
                                onValueChange={(newType: ActivityType) => handleActivityChange(index, { ...activity, type: newType, isAllDay: !!activityDetails[newType]?.isAllDay })}
                            >
                                <SelectTrigger className="w-[200px] bg-background">
                                    <SelectValue placeholder="בחר פעילות" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activityTypes.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {dayPlan.activities.length > 1 && (
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveActivity(index)}>
                                    <Trash2 className="text-destructive" />
                                </Button>
                            )}
                        </div>
                        {activity.type === 'אחר' && (
                             <Input 
                                placeholder="תיאור פעילות"
                                value={activity.description || ''}
                                className="bg-background"
                                onChange={e => handleActivityChange(index, { ...activity, description: e.target.value })}
                            />
                        )}
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox
                                id={`all-day-${dayKey}-${index}`}
                                checked={isEffectivelyAllDay}
                                onCheckedChange={(checked) => handleActivityChange(index, { ...activity, isAllDay: !!checked })}
                                disabled={!!details?.isAllDay}
                            />
                            <Label htmlFor={`all-day-${dayKey}-${index}`}>יום שלם</Label>
                        </div>
                        {!isEffectivelyAllDay && (
                            <div className="flex items-end gap-2 sm:gap-4 flex-wrap">
                                <div className="grid gap-1.5 flex-1 min-w-[100px]">
                                    <Label>שעת התחלה</Label>
                                    <Input
                                        type="time"
                                        className="bg-background"
                                        value={activity.startTime || ''}
                                        onChange={e => handleActivityChange(index, { ...activity, startTime: e.target.value })}
                                        onBlur={(e) => handleTimeBlur(e, index, 'startTime')}
                                    />
                                </div>
                                {!activity.noReturn && (
                                    <div className="grid gap-1.5 flex-1 min-w-[100px]">
                                        <Label>שעת סיום</Label>
                                        <Input
                                            type="time"
                                            className="bg-background"
                                            value={activity.endTime || ''}
                                            onChange={e => handleActivityChange(index, { ...activity, endTime: e.target.value })}
                                            onBlur={(e) => handleTimeBlur(e, index, 'endTime')}
                                        />
                                    </div>
                                )}
                                <div className="flex items-center space-x-2 space-x-reverse self-center pb-2">
                                    <Checkbox
                                        id={`no-return-${dayKey}-${index}`}
                                        checked={!!activity.noReturn}
                                        onCheckedChange={(checked) => handleActivityChange(index, { ...activity, noReturn: !!checked })}
                                    />
                                    <Label htmlFor={`no-return-${dayKey}-${index}`}>לא חוזר/ת</Label>
                                </div>
                            </div>
                        )}
                    </Card>
                )
            })}
             {canAddActivity() && (
                <Button variant="outline" onClick={handleAddActivity} className="w-full">
                    <PlusCircle className="me-2" />
                    הוסף פעילות
                </Button>
            )}
        </motion.div>
    )
}
