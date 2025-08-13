
"use client";

import { UserProfile } from "@/hooks/use-user-profile";
import { DayPlan, activityColorMap } from "@/types/weekly-plan";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "@/lib/utils";

interface UserPlan {
  user: UserProfile;
  plan?: DayPlan;
  status: 'loading' | 'loaded' | 'not-found';
}

interface UserStatusCardProps {
    userPlan: UserPlan;
}

const getInitials = (name: string = '') => {
  const parts = name.split(' ');
  if (parts.length > 1) {
    return `${parts[0]?.charAt(0) ?? ''}${parts[parts.length - 1]?.charAt(0) ?? ''}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};


export function UserStatusCard({ userPlan }: UserStatusCardProps) {
    const { user, plan } = userPlan;
    const fullName = `${user.firstName} ${user.lastName}`;

    const renderPlanDetails = () => {
        if (!plan || plan.activities.length === 0 || plan.activities[0].type === 'נא למלא') {
            return (
                <div className="p-3 text-center bg-gray-100 rounded-b-lg">
                    <p className="text-sm font-medium text-gray-600">טרם עודכנה תוכנית</p>
                </div>
            )
        }
        
        return (
            <div className="flex flex-col">
                {plan.activities.map((activity, index) => {
                    const activityColors = activityColorMap[activity.type] || activityColorMap['אחר'];
                    const timeText = activity.isAllDay ? "יום שלם" : `${activity.startTime || ''} - ${activity.noReturn ? 'יציאה' : activity.endTime || ''}`;

                    return (
                        <div key={index} className={cn(
                            "p-2 text-center", 
                            activityColors.background, 
                            activityColors.text,
                            index === 0 && plan.activities.length > 1 ? "rounded-b-none" : "",
                            index === plan.activities.length - 1 ? "rounded-b-lg" : "",
                            index > 0 ? "border-t" : ""
                        )}>
                            <p className="font-bold text-sm truncate">{activity.type === 'אחר' ? activity.description || 'אחר' : activity.type}</p>
                            <p className="text-xs">{timeText}</p>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-0">
                <div className="flex items-center gap-3 p-3">
                    <Avatar>
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{fullName}</p>
                        <p className="text-xs text-muted-foreground">{user.center || 'לא שויך מרכז'}</p>
                    </div>
                </div>
                {renderPlanDetails()}
            </CardContent>
        </Card>
    )
}
