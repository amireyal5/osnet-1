
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/main-layout";
import { useSurveys } from "@/hooks/use-surveys";
import { Survey } from "@/types";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SurveyForm } from "@/components/surveys/SurveyForm";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useToast } from "@/hooks/use-toast";


export default function TakeSurveyPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const surveyId = params.surveyId as string;
    const { getSurvey, submitSurveyResponse, hasUserSubmitted } = useSurveys();
    const { userProfile } = useUserProfile();

    const [survey, setSurvey] = useState<Survey | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);

    useEffect(() => {
        if (surveyId && userProfile) {
            const fetchSurveyAndCheckSubmission = async () => {
                setIsLoading(true);
                const [fetchedSurvey, submitted] = await Promise.all([
                    getSurvey(surveyId),
                    hasUserSubmitted(surveyId, userProfile.id)
                ]);
                setSurvey(fetchedSurvey);
                setAlreadySubmitted(submitted);
                setIsLoading(false);
            };
            fetchSurveyAndCheckSubmission();
        }
    }, [surveyId, getSurvey, userProfile, hasUserSubmitted]);

    const handleSubmit = async (answers: Record<string, any>) => {
        if (!userProfile) return;
        try {
            await submitSurveyResponse(surveyId, userProfile.id, answers);
            toast({ title: "התשובות נשלחו בהצלחה!", description: "תודה על השתתפותך." });
            router.push('/surveys');
        } catch (error) {
            console.error("Failed to submit survey:", error);
            toast({ title: "שגיאה בשליחת הסקר", variant: "destructive" });
        }
    }

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
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
             <Button variant="ghost" onClick={() => router.push('/surveys')} className="self-start">
                <ArrowRight className="me-2 h-4 w-4" />
                חזור לרשימת הסקרים
            </Button>
            <div className="p-6 border rounded-lg bg-card">
                <h1 className="text-2xl font-bold font-headline tracking-tight">{survey.title}</h1>
                <p className="text-muted-foreground mt-2">{survey.description}</p>
            </div>
            
            {alreadySubmitted ? (
                <div className="text-center p-8 bg-card rounded-lg border text-green-600">
                    <h2 className="text-xl font-semibold">כבר ענית על סקר זה.</h2>
                    <p>תודה רבה על השתתפותך!</p>
                </div>
            ) : (
                <SurveyForm survey={survey} onSubmit={handleSubmit} />
            )}

        </div>
    </MainLayout>
  );
}
