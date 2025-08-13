
"use client";

import { useState, useMemo } from "react";
import { Survey } from "@/types";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, BarChart2, Edit, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSurveys } from "@/hooks/use-surveys";
import { useToast } from "@/hooks/use-toast";
import { useUsers } from "@/hooks/use-users";


interface SurveysListProps {
  surveys: Survey[];
}

export function SurveysList({ surveys }: SurveysListProps) {
    const router = useRouter();
    const { deleteSurvey } = useSurveys();
    const { toast } = useToast();
    const { users } = useUsers();
    const [surveyToDelete, setSurveyToDelete] = useState<Survey | null>(null);

    const usersMap = useMemo(() => new Map(users.map(u => [u.id, `${u.firstName} ${u.lastName}`])), [users]);

    const handleDelete = async () => {
        if (!surveyToDelete) return;
        try {
            await deleteSurvey(surveyToDelete.id);
            toast({ title: "הסקר נמחק בהצלחה" });
        } catch (e) {
            toast({ title: "שגיאה במחיקת הסקר", variant: "destructive" });
        } finally {
            setSurveyToDelete(null);
        }
    }


  return (
    <>
    <div className="border rounded-lg">
      <Table dir="rtl">
        <TableHeader>
          <TableRow>
            <TableHead>שם הסקר</TableHead>
            <TableHead>נוצר ע"י</TableHead>
            <TableHead>תאריך יצירה</TableHead>
            <TableHead>מספר שאלות</TableHead>
            <TableHead>פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {surveys.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24">לא נמצאו סקרים. לחץ על "צור סקר חדש" כדי להתחיל.</TableCell>
            </TableRow>
          ) : (
            surveys.map(survey => (
              <TableRow key={survey.id}>
                <TableCell className="font-medium">{survey.title}</TableCell>
                <TableCell>{usersMap.get(survey.createdBy) || 'לא ידוע'}</TableCell>
                <TableCell>
                  {survey.createdAt ? format(survey.createdAt.toDate(), 'd MMMM yyyy', { locale: he }) : 'לא ידוע'}
                </TableCell>
                <TableCell>{survey.questions.length}</TableCell>
                <TableCell>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                             <DropdownMenuItem onSelect={() => router.push(`/surveys/${survey.id}`)}>
                                <FileText className="me-2 h-4 w-4" />
                                מלא סקר
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => router.push(`/surveys/${survey.id}/results`)}>
                                <BarChart2 className="me-2 h-4 w-4" />
                                צפה בתוצאות
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => router.push(`/surveys/${survey.id}/edit`)}>
                                <Edit className="me-2 h-4 w-4" />
                                ערוך
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setSurveyToDelete(survey)}>
                                <Trash2 className="me-2 h-4 w-4" />
                                מחק
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
    <AlertDialog open={!!surveyToDelete} onOpenChange={(open) => !open && setSurveyToDelete(null)}>
        <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
                <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                <AlertDialogDescription>
                    אתה עומד למחוק את הסקר "{surveyToDelete?.title}". פעולה זו היא בלתי הפיכה.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>ביטול</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    כן, מחק סקר
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
