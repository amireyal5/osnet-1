
export type ActivityType = 
    | 'נא למלא'
    | 'בחר פעילות'
    | 'במשרד'
    | 'מחלה'
    | 'חופשה'
    | 'יום פנוי'
    | 'יום בחירה'
    | 'הדרכה'
    | 'לימודים'
    | 'מילואים'
    | 'שכונה'
    | 'בית משפט'
    | 'במסגרת חוץ ביתית'
    | 'אחר';

export const activityTypes: ActivityType[] = [
    'במשרד',
    'שכונה',
    'בית משפט',
    'במסגרת חוץ ביתית',
    'הדרכה',
    'לימודים',
    'חופשה',
    'מחלה',
    'מילואים',
    'יום בחירה',
    'יום פנוי',
    'אחר',
];

export interface Activity {
  type: ActivityType;
  description?: string;
  isAllDay: boolean;
  noReturn?: boolean;
  startTime?: string;
  endTime?: string;
}

export interface DayPlan {
  activities: Activity[];
  isConfirmed: boolean;
}

export interface WeeklyPlan {
  [dayKey: string]: DayPlan;
}

// For business logic like auto-checking "all day"
export const activityDetails: Record<ActivityType, { isAllDay: boolean, description?: string }> = {
    'נא למלא': { isAllDay: true },
    'בחר פעילות': { isAllDay: false },
    'במשרד': { isAllDay: false, description: "עבודה במשרד" },
    'מחלה': { isAllDay: false, description: "יום מחלה" },
    'חופשה': { isAllDay: false, description: "יום חופש" },
    'יום פנוי': { isAllDay: true, description: "יום פנוי מהעבודה" },
    'יום בחירה': { isAllDay: true, description: "יום בחירה" },
    'הדרכה': { isAllDay: false, description: "הדרכה מקצועית" },
    'לימודים': { isAllDay: false, description: "יציאה ללימודים" },
    'מילואים': { isAllDay: false, description: "שירות מילואים" },
    'שכונה': { isAllDay: false, description: "עבודה בשכונה" },
    'בית משפט': { isAllDay: false, description: "דיון בבית משפט" },
    'במסגרת חוץ ביתית': { isAllDay: false, description: "פעילות במסגרת חוץ ביתית" },
    'אחר': { isAllDay: false },
};

export const activityColorMap: Record<ActivityType, { background: string, text: string, border: string }> = {
    'נא למלא': { background: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    'בחר פעילות': { background: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    'במשרד': { background: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
    'שכונה': { background: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
    'בית משפט': { background: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
    'מחלה': { background: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
    'חופשה': { background: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    'יום פנוי': { background: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    'הדרכה': { background: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
    'לימודים': { background: 'bg-pink-50', text: 'text-pink-800', border: 'border-pink-200' },
    'מילואים': { background: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
    'יום בחירה': { background: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
    'במסגרת חוץ ביתית': { background: 'bg-lime-50', text: 'text-lime-800', border: 'border-lime-200' },
    'אחר': { background: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
};
