
"use client";

import { Survey, SurveyQuestion } from "@/types";
import { SurveyResponse } from "@/hooks/use-surveys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SurveyResultsViewerProps {
    survey: Survey;
    responses: SurveyResponse[];
}

const processTextResponses = (responses: SurveyResponse[], questionId: string) => {
    return responses
        .map(r => r.answers[questionId])
        .filter(answer => typeof answer === 'string' && answer.trim() !== '');
};

const processChoiceResponses = (responses: SurveyResponse[], question: SurveyQuestion) => {
    const counts: Record<string, number> = {};
    (question.options || []).forEach(opt => counts[opt] = 0);
    
    responses.forEach(r => {
        const answer = r.answers[question.id];
        if (question.type === 'multiple-choice' || question.type === 'yes-no') {
            if (answer && counts.hasOwnProperty(answer)) {
                counts[answer]++;
            }
        } else if (question.type === 'checkboxes') {
            if (Array.isArray(answer)) {
                answer.forEach(opt => {
                    if (counts.hasOwnProperty(opt)) {
                        counts[opt]++;
                    }
                });
            }
        }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
};


export const SurveyResultsViewer = ({ survey, responses }: SurveyResultsViewerProps) => {

    if (responses.length === 0) {
        return (
             <div className="text-center p-8 bg-card rounded-lg border">
                <h2 className="text-xl font-semibold text-muted-foreground">טרם התקבלו תשובות לסקר זה.</h2>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {survey.questions.map((question, index) => {
                let content;
                if (question.type === 'text') {
                    const textAnswers = processTextResponses(responses, question.id);
                    content = (
                        <div className="max-h-60 overflow-y-auto space-y-2 rounded-md bg-muted/50 p-3">
                           {textAnswers.length > 0 ? textAnswers.map((answer, i) => (
                               <p key={i} className="text-sm border-b p-2 bg-background rounded">{answer}</p>
                           )) : <p className="text-sm text-muted-foreground p-2">אין תשובות טקסט לשאלה זו.</p>}
                        </div>
                    );
                } else if (question.type === 'yes-no') {
                     const chartData = processChoiceResponses(responses, { ...question, options: ['כן', 'לא'] });
                     content = (
                        <div style={{ direction: 'ltr' }} className="h-60">
                           <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                   <CartesianGrid strokeDasharray="3 3" />
                                   <XAxis type="number" allowDecimals={false} />
                                   <YAxis dataKey="name" type="category" width={60} />
                                   <Tooltip />
                                   <Bar dataKey="value" fill="hsl(var(--primary))" barSize={30} />
                               </BarChart>
                           </ResponsiveContainer>
                        </div>
                     );
                } else { // multiple-choice & checkboxes
                    const chartData = processChoiceResponses(responses, question);
                    content = (
                       <div style={{ direction: 'ltr' }} className="h-60">
                           <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                   <CartesianGrid strokeDasharray="3 3" />
                                   <XAxis dataKey="name" />
                                   <YAxis allowDecimals={false} />
                                   <Tooltip />
                                   <Bar dataKey="value" fill="hsl(var(--primary))" barSize={40} />
                               </BarChart>
                           </ResponsiveContainer>
                       </div>
                    );
                }

                return (
                    <Card key={question.id}>
                        <CardHeader>
                            <CardTitle className="text-lg">שאלה {index + 1}: {question.text}</CardTitle>
                            <CardDescription>סוג שאלה: {question.type}</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {content}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    )
}
