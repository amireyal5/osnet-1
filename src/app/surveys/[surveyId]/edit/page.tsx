
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MainLayout } from "@/components/main-layout";
import { SurveyBuilder } from "@/components/surveys/SurveyBuilder";
import { useSurveys } from "@/hooks/use-surveys";
import { Survey } from "@/types";
import { Loader2 } from "lucide-react";

export default function EditSurveyPage() {
    const params = useParams();
    const surveyId = params.surveyId as string;
    const { getSurvey } = useSurveys();
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (surveyId) {
            const fetchSurvey = async () => {
                setIsLoading(true);
                const fetchedSurvey = await getSurvey(surveyId);
                setSurvey(fetchedSurvey);
                setIsLoading(false);
            };
            fetchSurvey();
        }
    }, [surveyId, getSurvey]);

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="animate-spin text-primary" size={48} />
                </div>
            </MainLayout>
        );
    }
    
    if (!survey) {
         return (
            <MainLayout>
                <div className="text-center">לא נמצא סקר.</div>
            </MainLayout>
        );
    }

  return (
    <MainLayout>
        <SurveyBuilder existingSurvey={survey} />
    </MainLayout>
  );
}
