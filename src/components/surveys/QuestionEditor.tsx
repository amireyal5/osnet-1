
"use client";

import { SurveyQuestion, QuestionType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, PlusCircle, Circle, CheckSquare, MessageSquare, Check } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface QuestionEditorProps {
  question: SurveyQuestion;
  index: number;
  onUpdate: (id: string, updatedQuestion: SurveyQuestion) => void;
  onRemove: (id: string) => void;
}

const questionTypeOptions: { value: QuestionType, label: string, icon: React.FC<any> }[] = [
    { value: 'text', label: 'תשובה קצרה', icon: MessageSquare },
    { value: 'multiple-choice', label: 'בחירה מרובה (רדיו)', icon: Circle },
    { value: 'checkboxes', label: 'תיבות סימון', icon: CheckSquare },
    { value: 'yes-no', label: 'כן / לא', icon: Check },
]

export function QuestionEditor({ question, index, onUpdate, onRemove }: QuestionEditorProps) {

    const handleTypeChange = (newType: QuestionType) => {
        const updatedQuestion: SurveyQuestion = { ...question, type: newType };
        if (newType === 'multiple-choice' || newType === 'checkboxes') {
            if (!updatedQuestion.options || updatedQuestion.options.length === 0) {
                 updatedQuestion.options = ['אפשרות 1'];
            }
        } else {
            delete updatedQuestion.options;
        }
        onUpdate(question.id, updatedQuestion);
    }

    const handleOptionChange = (optionIndex: number, value: string) => {
        const newOptions = [...(question.options || [])];
        newOptions[optionIndex] = value;
        onUpdate(question.id, { ...question, options: newOptions });
    }

    const addOption = () => {
        const newOptions = [...(question.options || []), `אפשרות ${ (question.options?.length || 0) + 1 }`];
        onUpdate(question.id, { ...question, options: newOptions });
    }
    
    const removeOption = (optionIndex: number) => {
        const newOptions = (question.options || []).filter((_, i) => i !== optionIndex);
        onUpdate(question.id, { ...question, options: newOptions });
    }

  return (
    <Card className="bg-muted/30 border-l-4 border-primary">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className='flex items-start gap-4'>
            <span className='font-bold text-primary pt-2'>{index + 1}.</span>
            <div className="flex-1 space-y-2">
                <Input 
                    placeholder="כתוב את השאלה שלך כאן..."
                    value={question.text}
                    onChange={(e) => onUpdate(question.id, { ...question, text: e.target.value })}
                    className="text-base font-semibold bg-background"
                />
            </div>
            <Select value={question.type} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-[220px] bg-background">
                    <SelectValue placeholder="בחר סוג שאלה" />
                </SelectTrigger>
                <SelectContent>
                    {questionTypeOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                            <div className='flex items-center gap-2'>
                                <opt.icon className="h-4 w-4" />
                                <span>{opt.label}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => onRemove(question.id)}>
              <Trash2 className="text-destructive" />
            </Button>
        </div>
        
        <div className='ps-8'>
            {question.type === 'text' && (
                <div className='p-2 border-b border-dashed w-full text-sm text-muted-foreground'>תשובה קצרה</div>
            )}
             {question.type === 'yes-no' && (
                <div className='flex flex-col gap-2 p-2 text-sm text-muted-foreground'>
                   <div className='flex items-center gap-2'><Circle className='h-4 w-4'/> כן</div>
                   <div className='flex items-center gap-2'><Circle className='h-4 w-4'/> לא</div>
                </div>
            )}
            {(question.type === 'multiple-choice' || question.type === 'checkboxes') && (
                <div className="space-y-2">
                    {question.options?.map((option, i) => (
                        <div key={i} className="flex items-center gap-2">
                             {question.type === 'multiple-choice' ? <Circle className='h-4 w-4 text-muted-foreground'/> : <CheckSquare className='h-4 w-4 text-muted-foreground'/>}
                            <Input 
                                value={option}
                                onChange={(e) => handleOptionChange(i, e.target.value)}
                                className="bg-background/50 h-8"
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeOption(i)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={addOption} className="text-primary">
                        <PlusCircle className="me-2 h-4 w-4" />
                        הוסף אפשרות
                    </Button>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
