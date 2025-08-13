
"use client";

import { useState, useEffect, useMemo } from 'react';
import { UserProfile, USER_ROLES } from '@/hooks/use-user-profile';
import { useTeams } from '@/hooks/use-teams';
import { useNotifications } from '@/hooks/use-notifications';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { format, getISOWeek, addDays } from 'date-fns';
import { DayPlan, WeeklyPlan, ActivityType } from '@/types/weekly-plan';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Zap, Loader2 } from 'lucide-react';
import { UserStatusCard } from './UserStatusCard';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';

interface StatusWallProps {
  users: UserProfile[];
}

interface UserPlan {
  user: UserProfile;
  plan?: DayPlan;
  status: 'loading' | 'loaded' | 'not-found';
}

type UserCategory = "במשרד" | "עבודת שטח" | "לא זמינים" | "טרם עודכן";

const fieldWorkTypes: ActivityType[] = ['שכונה', 'בית משפט', 'במסגרת חוץ ביתית'];
const unavailableTypes: ActivityType[] = ['חופשה', 'מחלה', 'מילואים', 'יום בחירה', 'יום פנוי'];

const getWeekId = (date: Date): string => {
  const year = date.getFullYear();
  const weekNumber = getISOWeek(date);
  return `${year}-W${weekNumber}`;
};

const getActiveDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const hour = today.getHours();
    
    // After 4 PM on Thursday, or on Friday/Saturday, show next week's plan context
    if ((dayOfWeek === 4 && hour >= 16) || dayOfWeek === 5 || dayOfWeek === 6) {
        const nextSunday = addDays(today, 7 - dayOfWeek);
        return nextSunday;
    }
    return today;
}

export function StatusWall({ users }: StatusWallProps) {
    const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { userProfile } = useUserProfile();
    const { teams } = useTeams();
    const { handleCreateThread } = useNotifications();
    const { toast } = useToast();
    const [isBuzzing, setIsBuzzing] = useState(false);
    
    const today = useMemo(() => new Date(), []);
    const todayKey = useMemo(() => format(today, 'yyyy-MM-dd'), [today]);
    const relevantDateForPlan = useMemo(() => getActiveDate(), []);
    const weekId = useMemo(() => getWeekId(relevantDateForPlan), [relevantDateForPlan]);
    const relevantDateKey = useMemo(() => format(relevantDateForPlan, 'yyyy-MM-dd'), [relevantDateForPlan]);


    useEffect(() => {
        const fetchPlans = async () => {
            if (users.length === 0) {
                setUserPlans([]);
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);
            
            // The data model `users/{userId}/plans/{planId}` forces individual fetches.
            // This is acceptable for up to ~100 users as discussed.
            const plansPromises = users.map(async (user): Promise<UserPlan> => {
                try {
                    const planDocRef = doc(db, `users/${user.id}/plans/${weekId}`);
                    const docSnap = await getDoc(planDocRef);
                    if (docSnap.exists()) {
                        const weeklyPlan = docSnap.data() as WeeklyPlan;
                        // Use the key for the relevant date (today or next week's Sunday)
                        return { user, plan: weeklyPlan[relevantDateKey], status: 'loaded' };
                    }
                    return { user, status: 'not-found' };
                } catch (error) {
                    console.error(`Failed to fetch plan for ${user.firstName}`, error);
                    return { user, status: 'not-found' };
                }
            });

            const results = await Promise.all(plansPromises);
            setUserPlans(results);
            setIsLoading(false);
        };

        fetchPlans();
    }, [users, weekId, relevantDateKey]);


    const categorizedUsers = useMemo(() => {
        const categories: Record<UserCategory, UserPlan[]> = {
            "במשרד": [],
            "עבודת שטח": [],
            "לא זמינים": [],
            "טרם עודכן": [],
        };

        userPlans.forEach(userPlan => {
            const plan = userPlan.plan;
            if (userPlan.status === 'not-found' || !plan || plan.activities.length === 0 || plan.activities[0].type === 'נא למלא') {
                categories["טרם עודכן"].push(userPlan);
            } else {
                const primaryActivityType = plan.activities[0].type;
                if (primaryActivityType === 'במשרד' || primaryActivityType === 'הדרכה' || primaryActivityType === 'לימודים') {
                     categories["במשרד"].push(userPlan);
                } else if (fieldWorkTypes.includes(primaryActivityType)) {
                    categories["עבודת שטח"].push(userPlan);
                } else if (unavailableTypes.includes(primaryActivityType)) {
                    categories["לא זמינים"].push(userPlan);
                } else {
                    categories["במשרד"].push(userPlan); // Default to in-office
                }
            }
        });

        return categories;
    }, [userPlans]);
    
    const usersToBuzz = useMemo(() => {
      if (!userProfile) return [];

      const usersWithoutPlan = categorizedUsers["טרם עודכן"].map(p => p.user);

      if (userProfile.roles.includes(USER_ROLES.GENERAL_MANAGER) || userProfile.roles.includes(USER_ROLES.ADMIN)) {
          return usersWithoutPlan;
      }
      
      if (userProfile.roles.includes(USER_ROLES.TEAM_LEAD)) {
          const myTeams = teams.filter(t => t.teamLeadId === userProfile.id);
          const myTeamMemberIds = new Set(myTeams.flatMap(t => t.memberIds));
          return usersWithoutPlan.filter(u => myTeamMemberIds.has(u.id));
      }

      return [];
    }, [categorizedUsers, userProfile, teams]);

    const handleSendBuzzers = async () => {
        if (!userProfile || usersToBuzz.length === 0) return;
        setIsBuzzing(true);

        const senderName = `${userProfile.firstName} ${userProfile.lastName}`;
        
        const buzzPromises = usersToBuzz.map(targetUser => {
            const message = `הי ${targetUser.firstName}, קיבלת באזזר מ${senderName} לתזכורת נא מלא/י תוכנית שבועית.`;
            return handleCreateThread([targetUser], message);
        });

        try {
            await Promise.all(buzzPromises);
            toast({
                title: "באזזרים נשלחו!",
                description: `נשלחו תזכורות ל-${usersToBuzz.length} עובדים.`,
            });
        } catch (error) {
            console.error("Failed to send buzzers:", error);
            toast({ title: "שגיאה בשליחת הבאזזרים", variant: "destructive" });
        } finally {
            setIsBuzzing(false);
        }
    };
    
    const canBuzz = userProfile && (userProfile.roles.includes(USER_ROLES.GENERAL_MANAGER) || userProfile.roles.includes(USER_ROLES.TEAM_LEAD) || userProfile.roles.includes(USER_ROLES.ADMIN));

    if (isLoading) {
        return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({length: 4}).map((_, i) => (
                 <div key={i} className="flex flex-col gap-2 p-2 rounded-lg bg-muted/50">
                     <Skeleton className="h-8 w-1/2" />
                     <Skeleton className="h-24 w-full" />
                     <Skeleton className="h-24 w-full" />
                 </div>
            ))}
        </div>
    }

    const columnOrder: UserCategory[] = ["במשרד", "עבודת שטח", "לא זמינים", "טרם עודכן"];
    
    return (
        <div className="flex flex-col gap-4">
             {canBuzz && (
                <div className="flex justify-end">
                    <Button 
                        onClick={handleSendBuzzers} 
                        disabled={isBuzzing || usersToBuzz.length === 0}
                        className="rounded-full h-12 w-12 p-0 bg-yellow-400 text-yellow-900 hover:bg-yellow-500 shadow-lg fixed bottom-20 left-6 z-30"
                    >
                        {isBuzzing ? <Loader2 className="animate-spin" /> : <Zap />}
                        <span className="sr-only">שלח באזזר</span>
                    </Button>
                </div>
            )}
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-4 pb-4">
                    {columnOrder.map(category => (
                        <div key={category} className="w-72 flex-shrink-0">
                            <h2 className="text-lg font-semibold mb-2 sticky top-0 bg-background/80 backdrop-blur-sm p-2 rounded-md z-10">{category} ({categorizedUsers[category].length})</h2>
                            <div className="space-y-3 h-full">
                                {categorizedUsers[category].map(userPlan => (
                                    <UserStatusCard key={userPlan.user.id} userPlan={userPlan} />
                                ))}
                                {categorizedUsers[category].length === 0 && (
                                    <div className="text-center text-sm text-muted-foreground p-4">אין עובדים במצב זה</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}

  