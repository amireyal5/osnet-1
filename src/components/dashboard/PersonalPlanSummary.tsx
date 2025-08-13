
"use client";

import { useWeeklyPlan } from "@/hooks/use-weekly-plan";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CalendarCheck2 } from "lucide-react";
import { DayCard } from "../weekly-plan/DayCard";
import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";

export function PersonalPlanSummary() {
  const { weeklyPlan, isLoading } = useWeeklyPlan();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>סיכום תוכנית שבועית</CardTitle>
            <CardDescription>הצצה מהירה לתוכנית העבודה שלך לשבוע הנוכחי.</CardDescription>
        </div>
        <Button variant="outline" asChild>
            <Link href="/weekly-plan">
                <span>עבור לתוכנית המלאה</span>
                 <ArrowLeft className="ms-2 h-4 w-4" />
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex justify-center items-center p-8 h-32"><Loader2 className="animate-spin" /></div>
        ) : weeklyPlan ? (
            <div className="flex justify-between items-start gap-2 flex-wrap">
                {Object.entries(weeklyPlan).sort().map(([dayKey, dayPlan]) => (
                    <DayCard 
                        key={dayKey}
                        dayKey={dayKey}
                        dayPlan={dayPlan}
                        className="h-32 text-xs"
                    />
                ))}
            </div>
        ) : (
          <div className="text-center text-muted-foreground p-8 h-32 flex flex-col justify-center items-center">
            <CalendarCheck2 className="mx-auto h-10 w-10" />
            <p className="mt-4">לא נמצאה תוכנית לשבוע הנוכחי.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
