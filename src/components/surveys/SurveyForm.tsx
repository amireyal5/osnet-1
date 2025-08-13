
"use client";

import { useState } from "react";
import { Survey, SurveyQuestion } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface SurveyFormProps {
  survey: Survey;
  onSubmit: (answers: Record<string, any>) => void;
}

const renderQuestion = (question: SurveyQuestion, answer: any, onChange: (questionId: string, value: any) => void) => {
    switch (question.type) {
        case 'text':
            return (
                <Textarea 
                    value={answer || ''}
                    onChange={(e) => onChange(question.id, e.target.value)}
                    placeholder="התשובה שלך..."
                />
            );
        case 'multiple-choice':
            return (
                <RadioGroup value={answer} onValueChange={(value) => onChange(question.id, value)}>
                    {(question.options || []).map(option => (
                        <div key={option} className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                            <Label htmlFor={`${question.id}-${option}`} className="font-normal">{option}</Label>
                        </div>
                    ))}
                </RadioGroup>
            );
        case 'checkboxes':
            return (
                <div className="space-y-2">
                    {(question.options || []).map(option => (
                        <div key={option} className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox 
                                id={`${question.id}-${option}`}
                                checked={(answer || []).includes(option)}
                                onCheckedChange={(checked) => {
                                    const currentAnswers = answer || [];
                                    if (checked) {
                                        onChange(question.id, [...currentAnswers, option]);
                                    } else {
                                        onChange(question.id, currentAnswers.filter((val: string) => val !== option));
                                    }
                                }}
                            />
                            <Label htmlFor={`${question.id}-${option}`} className="font-normal">{option}</Label>
                        </div>
                    ))}
                </div>
            );
        case 'yes-no':
            return (
                <RadioGroup value={answer} onValueChange={(value) => onChange(question.id, value)}>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value="כן" id={`${question.id}-yes`} />
                        <Label htmlFor={`${question.id}-yes`} className="font-normal">כן</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value="לא" id={`${question.id}-no`} />
                        <Label htmlFor={`${question.id}-no`} className="font-normal">לא</Label>
                    </div>
                </RadioGroup>
            )
        default:
            return null;
    }
}


export function SurveyForm({ survey, onSubmit }: SurveyFormProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    onSubmit(answers);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {survey.questions.map((question, index) => (
        <Card key={question.id}>
            <CardHeader>
                <CardTitle className="text-lg">שאלה {index + 1}: {question.text}</CardTitle>
            </CardHeader>
            <CardContent>
                {renderQuestion(question, answers[question.id], handleAnswerChange)}
            </CardContent>
        </Card>
      ))}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="me-2 animate-spin" />}
            שלח תשובות
        </Button>
      </div>
    </form>
  );
}
