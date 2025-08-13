
"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export type RecurrenceEditScope = 'single' | 'future' | 'all';

interface RecurrenceEditDialogProps {
  actionType: 'update' | 'delete';
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scope: RecurrenceEditScope) => void;
}

export function RecurrenceEditDialog({ actionType, isOpen, onClose, onConfirm }: RecurrenceEditDialogProps) {
  
  const actionText = actionType === 'update' ? 'עדכון' : 'מחיקה';
  const title = `שינוי פגישה חוזרת`;
  const description = `האם ברצונך להחיל את ה${actionText} על פגישה זו בלבד, על פגישה זו וכל הבאות, או על כל הפגישות בסדרה?`;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => onConfirm('single')}>
              רק פגישה זו
            </Button>
            <Button onClick={() => onConfirm('future')}>
              זו והבאות
            </Button>
            <Button onClick={() => onConfirm('all')}>
              כל הסדרה
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
