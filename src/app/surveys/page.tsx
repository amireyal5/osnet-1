
"use client";

import { MainLayout } from "@/components/main-layout";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useSurveys } from "@/hooks/use-surveys";
import { SurveysList } from "@/components/surveys/SurveysList";

export default function SurveysPage() {
  const { surveys, isLoading } = useSurveys();

  return (
    <MainLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">סקרים ושאלונים</h1>
            <p className="text-muted-foreground">
              צור, נהל והפץ סקרים ושאלונים לעובדי הארגון.
            </p>
          </div>
          <Button asChild>
            <Link href="/surveys/new">
                <PlusCircle className="me-2 h-4 w-4" />
                צור סקר חדש
            </Link>
          </Button>
        </div>
        
        {isLoading ? (
            <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        ) : (
            <SurveysList surveys={surveys} />
        )}

      </div>
    </MainLayout>
  );
}
