
"use client";

import { MainLayout } from "@/components/main-layout"
import { UpcomingMeetings } from "@/components/dashboard/upcoming-meetings"
import { WeeklySchedule } from "@/components/dashboard/weekly-schedule"
import { useAuthCheck } from "@/hooks/use-auth-check";
import { WeeklyPlanVisualizer } from "../weekly-plan/WeeklyPlanVisualizer";

export default function DashboardPage() {
    const { isLoading } = useAuthCheck();

    if (isLoading) {
        return <div>טוען...</div>;
    }

  return (
    <MainLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">לוח בקרה</h1>
          <p className="text-muted-foreground">
            הנה מבט מהיר על השבוע שלך.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            <div className="xl:col-span-2">
                <WeeklySchedule />
            </div>
            <div className="xl:col-span-1">
                <UpcomingMeetings />
            </div>
        </div>
      </div>
    </MainLayout>
  )
}
