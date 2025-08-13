
"use client";

import { useMemo } from 'react';
import { UserProfile } from '@/hooks/use-user-profile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useWeeklyPlan } from '@/hooks/use-weekly-plan'; // This might not work as expected if it's per-user
import { DayPlan, WeeklyPlan, activityColorMap } from '@/types/weekly-plan';
import { format, getISOWeek } from 'date-fns';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';

interface UserDailyPlan {
    user: UserProfile;
    plan: DayPlan | null;
}

const getWeekId = (date: Date): string => {
  const year = date.getFullYear();
  const weekNumber = getISOWeek(date);
  return `${year}-W${weekNumber}`;
};

const getInitials = (name: string = '') => {
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0]?.charAt(0) ?? ''}${parts[parts.length - 1]?.charAt(0) ?? ''}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
};


export function DailyAttendanceTable({ users }: { users: UserProfile[] }) {
    const [userPlans, setUserPlans] = useState<UserDailyPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const today = useMemo(() => new Date(), []);
    const todayKey = useMemo(() => format(today, 'yyyy-MM-dd'), [today]);
    const weekId = useMemo(() => getWeekId(today), [today]);

    useEffect(() => {
        const fetchPlans = async () => {
             if (users.length === 0) {
                setUserPlans([]);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            const plansPromises = users.map(async (user): Promise<UserDailyPlan> => {
                try {
                    const planDocRef = doc(db, `users/${user.id}/plans/${weekId}`);
                    const docSnap = await getDoc(planDocRef);
                    if (docSnap.exists()) {
                        const weeklyPlan = docSnap.data() as WeeklyPlan;
                        return { user, plan: weeklyPlan[todayKey] || null };
                    }
                    return { user, plan: null };
                } catch (error) {
                    console.error(`Failed to fetch plan for ${user.firstName}`, error);
                    return { user, plan: null };
                }
            });
            const results = await Promise.all(plansPromises);
            setUserPlans(results);
            setIsLoading(false);
        }
        fetchPlans();
    }, [users, weekId, todayKey]);


    return (
        <div className="border rounded-lg">
            <Table dir="rtl">
                <TableHeader>
                    <TableRow>
                        <TableHead>שם העובד/ת</TableHead>
                        <TableHead>תוכנית להיום</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                            </TableRow>
                        ))
                    ) : userPlans.length > 0 ? (
                        userPlans.map(({ user, plan }) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3 font-medium">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user.photoURL} />
                                            <AvatarFallback>{getInitials(`${user.firstName} ${user.lastName}`)}</AvatarFallback>
                                        </Avatar>
                                        {user.firstName} {user.lastName}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {plan && plan.activities.length > 0 && plan.activities[0].type !== 'נא למלא' ? (
                                        <div className="flex flex-wrap gap-2">
                                            {plan.activities.map((activity, index) => {
                                                const colors = activityColorMap[activity.type] || activityColorMap['אחר'];
                                                const time = activity.isAllDay ? "יום שלם" : `${activity.startTime}-${activity.endTime}`;
                                                return (
                                                    <div key={index} className={`p-2 rounded-md ${colors.background} ${colors.text} border ${colors.border}`}>
                                                        <p className="font-semibold">{activity.type === 'אחר' ? activity.description : activity.type}</p>
                                                        {!activity.isAllDay && <p className="text-xs">{time}</p>}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">לא עודכנה תוכנית</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                         <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center">
                                לא נמצאו עובדים במרכז זה.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
