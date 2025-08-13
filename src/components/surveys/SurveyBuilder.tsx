
"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader2, ArrowRight, Share2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Survey, SurveyQuestion } from '@/types';
import { QuestionEditor } from './QuestionEditor';
import { useSurveys } from '@/hooks/use-surveys';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ShareSurveyDialog } from './ShareSurveyDialog';

interface SurveyBuilderProps {
    existingSurvey?: Survey | null;
}

// Helper to format Firestore Timestamp to datetime-local string
const formatTimestampForInput = (timestamp?: Timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    // The format required by datetime-local is YYYY-MM-DDTHH:mm
    return format(date, "yyyy-MM-dd'T'HH:mm");
};

export function SurveyBuilder({ existingSurvey = null }: SurveyBuilderProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [openAt, setOpenAt] = useState('');
  const [closeAt, setCloseAt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [surveyToShare, setSurveyToShare] = useState<Survey | null>(null);
  
  const { userProfile } = useUserProfile();
  const { createSurvey, updateSurvey } = useSurveys();
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    if (existingSurvey) {
        setTitle(existingSurvey.title);
        setDescription(existingSurvey.description);
        setQuestions(existingSurvey.questions);
        setOpenAt(formatTimestampForInput(existingSurvey.openAt));
        setCloseAt(formatTimestampForInput(existingSurvey.closeAt));
        setSurveyToShare(existingSurvey);
    }
  }, [existingSurvey]);

  const addQuestion = () => {
    setQuestions([...questions, { id: uuidv4(), text: '', type: 'text' }]);
  };

  const updateQuestion = (id: string, updatedQuestion: SurveyQuestion) => {
    setQuestions(questions.map(q => q.id === id ? updatedQuestion : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };
  
  const validateSurvey = () => {
     if (!title.trim() || !userProfile) {
        toast({
            title: "שגיאה",
            description: "כותרת הסקר היא שדה חובה.",
            variant: "destructive"
        })
      return false;
    }
    if (openAt && closeAt && new Date(openAt) >= new Date(closeAt)) {
        toast({
            title: "שגיאה בתאריכים",
            description: "תאריך הסגירה חייב להיות אחרי תאריך הפתיחה.",
            variant: "destructive"
        });
        return false;
    }
    return true;
  }

  const handleSave = async (andShare: boolean = false) => {
    if (!validateSurvey() || !userProfile) return;

    setIsLoading(true);
    try {
      const surveyData: Partial<Survey> = {
        title,
        description,
        questions,
        createdBy: userProfile.id,
        openAt: openAt ? Timestamp.fromDate(new Date(openAt)) : undefined,
        closeAt: closeAt ? Timestamp.fromDate(new Date(closeAt)) : undefined,
      };

      if (existingSurvey) {
        await updateSurvey(existingSurvey.id, surveyData);
        toast({ title: "הסקר עודכן בהצלחה!"});
        if (andShare) {
            setSurveyToShare({ ...existingSurvey, ...surveyData });
            setIsShareModalOpen(true);
        } else {
            router.push('/surveys');
        }
      } else {
        const newSurveyId = await createSurvey(surveyData as Omit<Survey, 'id' | 'createdAt'>);
        toast({ title: "הסקר נוצר בהצלחה!"});
        if (andShare) {
            setSurveyToShare({ id: newSurveyId, ...surveyData } as Survey);
            setIsShareModalOpen(true);
        } else {
             router.push('/surveys');
        }
      }

    } catch (error) {
      console.error("Failed to save survey", error);
       toast({ title: "שגיאה בשמירת הסקר", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-12" dir="rtl">
      <div>
        {existingSurvey ? (
             <Button variant="ghost" onClick={() => router.push('/surveys')} className="self-start mb-4">
                <ArrowRight className="me-2 h-4 w-4" />
                חזור לרשימת הסקרים
            </Button>
        ) : null}
        <h1 className="text-3xl font-bold font-headline tracking-tight">
            {existingSurvey ? "עריכת סקר" : "יצירת סקר חדש"}
        </h1>
        <p className="text-muted-foreground">
            {existingSurvey ? "ערוך את פרטי הסקר והשאלות." : "מלא את הפרטים והוסף שאלות כדי לבנות את הסקר שלך."}
        </p>
      </div>

      <div className="grid gap-4 p-6 border rounded-lg bg-card">
        <div className="grid gap-1.5">
          <Label htmlFor="survey-title">כותרת הסקר</Label>
          <Input id="survey-title" placeholder="לדוגמה: שביעות רצון מהאירוע השנתי" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="survey-description">תיאור (אופציונלי)</Label>
          <Textarea id="survey-description" placeholder="הסבר קצר על מטרת הסקר" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
                <Label htmlFor="openAt">פתיחה למענה (אופציונלי)</Label>
                <Input id="openAt" type="datetime-local" value={openAt} onChange={e => setOpenAt(e.target.value)} />
            </div>
             <div className="grid gap-1.5">
                <Label htmlFor="closeAt">סגירה למענה (אופציונלי)</Label>
                <Input id="closeAt" type="datetime-local" value={closeAt} onChange={e => setCloseAt(e.target.value)} />
            </div>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <QuestionEditor 
            key={question.id} 
            question={question}
            index={index}
            onUpdate={updateQuestion}
            onRemove={removeQuestion}
          />
        ))}
      </div>

      <Button variant="outline" onClick={addQuestion}>
        <PlusCircle className="me-2" />
        הוסף שאלה
      </Button>
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={() => router.push('/surveys')}>ביטול</Button>
        <Button onClick={() => handleSave(false)} disabled={isLoading}>
          {isLoading && <Loader2 className="me-2 animate-spin" />}
          שמור שינויים
        </Button>
        <Button onClick={() => handleSave(true)} disabled={isLoading} variant="secondary">
            {isLoading && <Loader2 className="me-2 animate-spin" />}
            <Share2 className="me-2" />
            שמור ושתף
        </Button>
      </div>
    </div>
     {surveyToShare && (
        <ShareSurveyDialog
            isOpen={isShareModalOpen}
            onOpenChange={setIsShareModalOpen}
            survey={surveyToShare}
        />
     )}
    </>
  );
}
