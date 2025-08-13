
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/main-layout"
import { useAuthCheck } from "@/hooks/use-auth-check";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { UpcomingMeetings } from "@/components/dashboard/UpcomingMeetings";
import { PersonalPlanSummary } from "@/components/dashboard/PersonalPlanSummary";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { useUserProfile, USER_ROLES } from "@/hooks/use-user-profile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, MessageSquare, Home, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

// SVG Icons as React Components
const SunriseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        {/* Sun */}
        <circle cx="32" cy="32" r="12" fill="#FFD700" />
        {/* Sun Rays */}
        <path d="M32 12V4m11.3 7.7l5.6-5.6M52 32h8M43.3 43.3l5.6 5.6M32 52v8M20.7 43.3l-5.6 5.6M12 32H4m7.7-11.3l-5.6-5.6" fill="none" stroke="#FFD700" strokeLinecap="round" strokeWidth="3" />
        {/* Waves */}
        <path d="M4,44 C12,36 20,36 28,44 S44,52 52,44 S68,36 72,44" fill="none" stroke="#0077be" strokeWidth="3" strokeLinecap="round"/>
        <path d="M-4,52 C4,44 12,44 20,52 S36,60 44,52 S60,44 68,52" fill="none" stroke="#005b96" strokeWidth="3" strokeLinecap="round"/>
        <path d="M0,60 C8,52 16,52 24,60 S40,68 48,60 S64,52 72,60" fill="none" stroke="#003b5c" strokeWidth="3" strokeLinecap="round"/>
    </svg>
);

const SunIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <linearGradient id="b" x1="24.5" x2="39.5" y1="13.5" y2="40.5" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#ffc300"/><stop offset="1" stopColor="#ffd60a"/></linearGradient>
        <circle cx="32" cy="32" r="20" fill="url(#b)"/>
        <path d="M32 6v6m17 19h6M9 31h6m17 23v-6M49.5 14.5l-4.2 4.2M14.5 49.5l-4.2 4.2M18.7 14.5l-4.2-4.2M45.3 49.5l4.2-4.2" fill="none" stroke="#ffd60a" strokeLinecap="round" strokeWidth="3" strokeMiterlimit="10"/>
    </svg>
);

const SunsetIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="sunsetGradient" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#fca311" />
                <stop offset="100%" stopColor="#f55555" />
            </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="14" fill="url(#sunsetGradient)" />
        <path d="M0,64 C10,48 20,48 32,54 C44,60 54,60 64,50 V64 H0 Z" fill="#4a5568" opacity="0.8" />
        <path d="M0,64 C12,52 22,52 32,58 C42,64 52,58 64,54 V64 H0 Z" fill="#4a5568" opacity="0.6" />
    </svg>
);

const MoonIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M46.6 41.8C44 44.5 40.3 46 36.2 46c-7.7 0-14-6.3-14-14s6.3-14 14-14c1.8 0 3.6.4 5.2 1.1-.9 2.1-1.3 4.4-1.3 6.9c0 8.3 6.7 15 15 15c1.4 0 2.8-.2 4.1-.6-.6 2.3-1.8 4.4-3.6 6.4z" fill="#e2e8f0"/>
        <path d="M45.4 39.5c-.3.2-.6.3-.9.5c-2.4 1.5-5.3 2.3-8.3 2.3c-7.7 0-14-6.3-14-14s6.3-14 14-14c1.8 0 3.6.4 5.2 1.1c.3.1.5.3.7.5c-1-2-1.6-4.2-1.6-6.6c0-1.8.3-3.6.9-5.3c-.6-.1-1.3-.2-1.9-.2C24.3 4 12 16.3 12 32s12.3 28 28 28c3.5 0 6.9-.7 10-1.9c-2.2-1.4-4-3.4-5.2-5.7c-2.4.9-5.1 1.2-7.8 1-7.5-.7-13.6-7.1-12.8-14.7.7-7.2 6.9-12.8 14-12.8 3.3 0 6.3 1.2 8.7 3.1z" fill="#4a5568"/>
    </svg>
);

type Greeting = {
    text: string;
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

export default function DashboardPage() {
    const { isLoading: isAuthLoading } = useAuthCheck();
    const { userProfile, isLoading: isProfileLoading } = useUserProfile();
    const [greeting, setGreeting] = useState<Greeting | null>(null);
    const { threads } = useNotifications();
    
    const lastUnreadThread = threads
        .filter(t => userProfile && t.unreadCounts[userProfile.id] > 0)
        .sort((a, b) => b.lastMessageTimestamp.toMillis() - a.lastMessageTimestamp.toMillis())[0];


    useEffect(() => {
        const getGreeting = (): Greeting => {
            const currentHour = new Date().getHours();
            if (currentHour >= 5 && currentHour < 12) {
                return { text: "בוקר טוב", Icon: SunriseIcon };
            }
            if (currentHour >= 12 && currentHour < 17) {
                return { text: "צהריים טובים", Icon: SunIcon };
            }
            if (currentHour >= 17 && currentHour < 21) {
                return { text: "ערב טוב", Icon: SunsetIcon };
            }
            return { text: "לילה טוב", Icon: MoonIcon };
        };
        setGreeting(getGreeting());
    }, []);

    const isLoading = isAuthLoading || isProfileLoading;

    if (isLoading || !greeting) {
        return <div className="flex h-screen w-full items-center justify-center">טוען...</div>;
    }

    const { Icon, text } = greeting;
    const showCompleteProfileAlert = userProfile && !userProfile.isProfileComplete;

    const isSecurity = userProfile && userProfile.roles.includes(USER_ROLES.SECURITY);

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Icon className="h-10 w-10" />
          <div>
            <h1 className="text-2xl font-bold font-headline tracking-tight">
              {text}, {userProfile?.firstName || 'משתמש'}!
            </h1>
            <p className="text-muted-foreground">
              הנה מבט מהיר על היום והשבוע שלך.
            </p>
          </div>
        </div>

        {showCompleteProfileAlert && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>השלמת פרטים נדרשת</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                   <span>אנא השלם את פרטי הפרופיל שלך כדי להמשיך להשתמש במערכת.</span>
                   <Button asChild>
                       <Link href="/profile">השלם פרטים</Link>
                   </Button>
                </AlertDescription>
            </Alert>
        )}

        {lastUnreadThread && userProfile && (
             <Alert>
                <MessageSquare className="h-4 w-4" />
                <AlertTitle>הודעה חדשה</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                   <div>
                        <span className="font-semibold">{lastUnreadThread.participants[lastUnreadThread.lastMessageSenderId]?.firstName || 'מישהו'}</span>
                        <span className="text-muted-foreground"> - {lastUnreadThread.lastMessageContent.substring(0, 50)}...</span>
                        <span className="text-xs text-muted-foreground ms-2">({formatDistanceToNow(lastUnreadThread.lastMessageTimestamp.toDate(), { addSuffix: true, locale: he })})</span>
                   </div>
                   <Button asChild variant="outline">
                       <Link href="/notifications">פתח הודעות</Link>
                   </Button>
                </AlertDescription>
            </Alert>
        )}

        <StatsCards />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <UpcomingMeetings />
            </div>
            <div>
                 <QuickActions />
            </div>
        </div>

        {!isSecurity && <PersonalPlanSummary />}
      </div>
    </MainLayout>
  )
}

    