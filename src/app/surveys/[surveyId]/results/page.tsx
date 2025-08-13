
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/main-layout";
import { useSurveys, SurveyResponse } from "@/hooks/use-surveys";
import { Survey } from "@/types";
import { Loader2, ArrowRight, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SurveyResultsViewer } from "@/components/surveys/SurveyResultsViewer";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useUsers } from "@/hooks/use-users";

export default function SurveyResultsPage() {
    const params = useParams();
    const router = useRouter();
    const surveyId = params.surveyId as string;
    const { getSurvey, getSurveyResponses } = useSurveys();
    const { users } = useUsers();

    const [survey, setSurvey] = useState<Survey | null>(null);
    const [responses, setResponses] = useState<SurveyResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (surveyId) {
            const fetchSurveyData = async () => {
                setIsLoading(true);
                const [fetchedSurvey, fetchedResponses] = await Promise.all([
                    getSurvey(surveyId),
                    getSurveyResponses(surveyId)
                ]);
                setSurvey(fetchedSurvey);
                setResponses(fetchedResponses);
                setIsLoading(false);
            };
            fetchSurveyData();
        }
    }, [surveyId, getSurvey, getSurveyResponses]);

    const handleExport = () => {
        if (!survey || responses.length === 0) return;

        const usersMap = new Map(users.map(u => [u.id, `${u.firstName} ${u.lastName}`]));

        const dataToExport = responses.map(response => {
            const row: { [key: string]: any } = {
                'שם המשיב': usersMap.get(response.userId) || response.userId,
            };
            survey.questions.forEach(q => {
                const answer = response.answers[q.id];
                row[q.text] = Array.isArray(answer) ? answer.join(', ') : (answer ?? 'לא נענה');
            });
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "תוצאות הסקר");

        // Set column widths
        const cols = [{ wch: 20 }]; // Responder name
        survey.questions.forEach(q => cols.push({ wch: Math.max(30, q.text.length) }));
        worksheet['!cols'] = cols;

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        
        saveAs(data, `${survey.title}_results.xlsx`);
    };

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
            <div className="flex justify-between items-center">
                <Button variant="ghost" onClick={() => router.push('/surveys')} className="self-start">
                    <ArrowRight className="me-2 h-4 w-4" />
                    חזור לרשימת הסקרים
                </Button>
                <Button onClick={handleExport} disabled={responses.length === 0}>
                    <Download className="me-2 h-4 w-4" />
                    הורד CSV
                </Button>
            </div>
            <div className="p-6 border rounded-lg bg-card">
                <h1 className="text-2xl font-bold font-headline tracking-tight">{survey.title}</h1>
                <p className="text-muted-foreground mt-2">{survey.description}</p>
                 <p className="text-sm text-muted-foreground mt-4">סה"כ משיבים: {responses.length}</p>
            </div>
            
            <SurveyResultsViewer survey={survey} responses={responses} />

        </div>
    </MainLayout>
  );
}
