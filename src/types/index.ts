
import { Timestamp } from "firebase/firestore";
import type { Center } from "@/hooks/use-user-profile";


export interface Guest {
    id: string;
    fullName: string;
    visitStartDateTime: Timestamp;
    visitEndDateTime: Timestamp;
    status: 'scheduled' | 'arrived' | 'departed' | 'no-show';
    ownerId: string;
    ownerName: string;
    ownerPhotoURL: string | null;
    center: Center;
    createdAt: Timestamp;
    isCancelled: boolean;
    cancelledBy?: string;
    cancelledAt?: Timestamp;
    atRisk?: boolean;
    isRecurring?: boolean;
    seriesId?: string;
}

// --- Survey Types ---

export type QuestionType = 'multiple-choice' | 'checkboxes' | 'text' | 'yes-no';

export interface SurveyQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // For 'multiple-choice' and 'checkboxes'
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  openAt?: Timestamp;
  closeAt?: Timestamp;
}
