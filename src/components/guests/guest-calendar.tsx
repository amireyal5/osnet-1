
"use client"

import { useState, useMemo } from "react"
import { 
  addMonths, 
  eachDayOfInterval, 
  endOfMonth, 
  endOfWeek, 
  format, 
  startOfMonth, 
  startOfWeek, 
  subMonths, 
  isSameMonth,
  isToday,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  eachHourOfInterval,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
  isPast
} from "date-fns"
import { he } from "date-fns/locale"
import { ChevronLeft, ChevronRight, AlertTriangle, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CalendarView } from "@/app/guests/page";
import { Skeleton } from "../ui/skeleton"
import { Guest, useGuests } from "@/hooks/use-guests"

type GuestsByTimeSlot = {
  [key: string]: Guest[];
}

type GuestCalendarProps = {
  view: CalendarView;
  onTimeSlotClick: (dateTime: Date) => void;
  onGuestClick: (guest: Guest) => void;
}

const dayNamesHe = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const workDayNamesHe = ["ראשון", "שני", "שלישי", "רביעי", "חמישי"];

const getNextRoundHourDate = (date: Date) => {
    const now = new Date();
    const currentHour = getHours(now);
    const currentMinute = getMinutes(now);

    const hour = currentMinute > 0 ? currentHour + 1 : currentHour;
    
    let newDate = setHours(date, hour);
    newDate = setMinutes(newDate, 0);

    return newDate;
}

export function GuestCalendar({ view, onTimeSlotClick, onGuestClick }: GuestCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Define view ranges
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const dayStart = startOfDay(currentDate);
  const dayEnd = endOfDay(currentDate);

  let viewRange;
  switch (view) {
    case 'day':
      viewRange = { start: dayStart, end: dayEnd };
      break;
    case 'week':
      viewRange = { start: weekStart, end: weekEnd };
      break;
    default: // month
      viewRange = { start: startOfWeek(monthStart, { weekStartsOn: 0 }), end: endOfWeek(monthEnd, { weekStartsOn: 0 }) };
      break;
  }

  const { guests, isLoading } = useGuests({ dateRange: viewRange });

  const guestsByTimeSlot = useMemo(() => {
    const grouped: GuestsByTimeSlot = {};
    guests.forEach(guest => {
        const key = view === 'month' 
            ? format(guest.visitStartDateTime.toDate(), "yyyy-MM-dd") 
            : format(guest.visitStartDateTime.toDate(), "yyyy-MM-dd-HH");

        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(guest);
    });
    return grouped;
  }, [guests, view]);


  const handlePrev = () => {
    switch (view) {
      case 'day': setCurrentDate(subDays(currentDate, 1)); break;
      case 'week': setCurrentDate(subDays(currentDate, 7)); break;
      default: setCurrentDate(subMonths(currentDate, 1)); break;
    }
  }

  const handleNext = () => {
    switch (view) {
      case 'day': setCurrentDate(addDays(currentDate, 1)); break;
      case 'week': setCurrentDate(addDays(currentDate, 7)); break;
      default: setCurrentDate(addMonths(currentDate, 1)); break;
    }
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  }

  const daysInMonth = useMemo(() => eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 0 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
  }), [monthStart, monthEnd]);

  const workDaysInWeek = useMemo(() => eachDayOfInterval({
    start: weekStart,
    end: weekEnd
  }).slice(0, 5), [weekStart, weekEnd]);
  
  const hours = useMemo(() => eachHourOfInterval({
      start: setHours(new Date(), 8),
      end: setHours(new Date(), 19)
  }), []);


  const renderMonthView = () => (
    <div className="grid grid-cols-7 border-t border-e">
      {dayNamesHe.map((day) => (
        <div key={day} className="text-center font-medium text-muted-foreground p-2 text-sm border-b border-s">
          {day}
        </div>
      ))}
      {daysInMonth.map((day) => {
        const dayKey = format(day, "yyyy-MM-dd")
        const dayGuests = guestsByTimeSlot[dayKey] || []
        
        return (
          <div
            key={day.toString()}
            onClick={() => onTimeSlotClick(getNextRoundHourDate(day))}
            className={cn(
              "h-36 border-s border-b p-2 flex flex-col cursor-pointer hover:bg-muted relative",
               !isSameMonth(day, monthStart) && "bg-muted/50 text-muted-foreground"
            )}
          >
            <div className="flex justify-between items-center">
                <span className={cn("font-medium", { "text-primary font-bold": isToday(day) })}>
                  {format(day, "d")}
                </span>
                <button onClick={(e) => {e.stopPropagation(); onTimeSlotClick(getNextRoundHourDate(day));}} className="opacity-0 hover:opacity-100 transition-opacity">
                    <PlusCircle className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto mt-1 space-y-1">
              {dayGuests.map((guest, i) => (
                  <div key={i} className={cn(
                      "p-1.5 text-xs rounded-md text-white truncate flex items-center gap-1", 
                      guest.atRisk ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90",
                      isPast(guest.visitEndDateTime.toDate()) && "opacity-50"
                  )}
                    onClick={(e) => { e.stopPropagation(); onGuestClick(guest); }}
                  >
                      {guest.atRisk && <AlertTriangle className="h-3 w-3" />}
                      <span>{guest.fullName}</span>
                  </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  );

  const renderWeekView = () => (
      <div className="relative overflow-auto h-full">
        <div className="grid grid-cols-[auto_1fr] h-full">
            <div className="sticky top-0 z-20 bg-background border-b">
                 <div className="h-14 border-b"></div> {/* Spacer for header */}
                 {hours.map((hour, hourIndex) => (
                    <div key={hourIndex} className="h-16 flex items-center justify-end pe-2 text-xs text-muted-foreground border-t border-e">
                         {format(hour, 'HH:mm')}
                    </div>
                 ))}
            </div>
            <div className="overflow-x-auto">
                <div className="grid grid-cols-5 min-w-[500px]">
                     {workDayNamesHe.map((dayName, index) => (
                        <div key={dayName} className="sticky top-0 z-20 bg-background text-center font-medium text-muted-foreground p-2 text-sm border-b h-14 flex items-center justify-center border-s">
                            {dayName} - {format(workDaysInWeek[index], 'd/M')}
                        </div>
                    ))}
                    {workDaysInWeek.map((day) => (
                        <div key={day.toString()} className="border-s relative">
                            {hours.map((hour, hourIndex) => (
                                <div 
                                    key={hourIndex} 
                                    className="h-16 border-t text-xs text-muted-foreground p-1 cursor-pointer hover:bg-muted"
                                    onClick={() => onTimeSlotClick(setMinutes(setHours(day, hour.getHours()), 0))}
                                >
                                   {/* Time slot rendering can be added here */}
                                </div>
                            ))}
                             {guests.filter(g => format(g.visitStartDateTime.toDate(), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')).map((guest) => {
                                const start = guest.visitStartDateTime.toDate();
                                const end = guest.visitEndDateTime.toDate();
                                const top = (start.getHours() - 8 + start.getMinutes() / 60) * 64; // 64px per hour
                                const height = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 64;
                                return (
                                    <div
                                        key={guest.id}
                                        className={cn(
                                            "absolute w-[calc(100%-4px)] m-[2px] p-2 text-xs rounded-md text-white z-10 cursor-pointer",
                                            guest.atRisk ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90",
                                            isPast(guest.visitEndDateTime.toDate()) && "opacity-50"
                                        )}
                                        style={{ top: `${top}px`, height: `${height}px` }}
                                        onClick={(e) => { e.stopPropagation(); onGuestClick(guest); }}
                                    >
                                        <p className="font-semibold flex items-center gap-1">
                                            {guest.atRisk && <AlertTriangle className="h-3 w-3" />}
                                            {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                                        </p>
                                        <p className="truncate">{guest.fullName}</p>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
  );

  const renderDayView = () => (
     <div className="border rounded-lg overflow-hidden">
        {hours.map((hour, hourIndex) => {
            const dayKey = format(currentDate, "yyyy-MM-dd");
            const key = `${dayKey}-${format(hour, "HH")}`;
            const hourGuests = (guestsByTimeSlot[key] || []);

            return (
                <div 
                    key={hourIndex} 
                    className="grid grid-cols-[auto_1fr] items-start p-4 border-b last:border-b-0 cursor-pointer hover:bg-muted"
                    onClick={() => onTimeSlotClick(setMinutes(setHours(currentDate, hour.getHours()), 0))}
                >
                    <div className="text-sm text-muted-foreground pe-4 pt-1">{format(hour, 'HH:mm')}</div>
                    <div className="relative grid gap-2">
                        {hourGuests.map(guest => (
                           <div key={guest.id} 
                                className={cn(
                                    "p-2 text-xs rounded-md text-white cursor-pointer", 
                                    guest.atRisk ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90",
                                    isPast(guest.visitEndDateTime.toDate()) && "opacity-50"
                                )}
                                onClick={(e) => { e.stopPropagation(); onGuestClick(guest); }}
                            >
                                <p className="font-semibold flex items-center gap-1">
                                    {guest.atRisk && <AlertTriangle className="h-3 w-3" />}
                                    {guest.fullName}
                                </p>
                                <p>{format(guest.visitStartDateTime.toDate(), 'HH:mm')} - {format(guest.visitEndDateTime.toDate(), 'HH:mm')}</p>
                           </div>
                        ))}
                         {hourGuests.length === 0 && <div className="h-8"></div>}
                    </div>
                </div>
            )
        })}
     </div>
  );
  
  const getTitle = () => {
    switch (view) {
      case 'day': return format(currentDate, "eeee, d MMMM yyyy", { locale: he });
      case 'week': return `שבוע של ${format(weekStart, "d MMMM", { locale: he })} - ${format(weekEnd, "d MMMM yyyy", { locale: he })}`;
      default: return format(currentDate, "MMMM yyyy", { locale: he });
    }
  }

  return (
    <>
    <div className="bg-card rounded-lg border shadow-sm mt-4 flex flex-col flex-1" dir="rtl">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrev}>
              <ChevronRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" onClick={handleToday}>היום</Button>
            <Button variant="ghost" size="icon" onClick={handleNext}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
        </div>
        <h2 className="text-lg font-headline font-semibold text-center">
          {getTitle()}
        </h2>
        {/* Placeholder to balance the flex layout */}
        <div className="w-[136px]"></div>
      </div>
       <div className="flex-1 overflow-auto">
         {isLoading ? 
          <div className="p-8"><Skeleton className="h-96 w-full" /></div> : 
          view === 'month' ? renderMonthView() : 
          view === 'week' ? renderWeekView() : 
          renderDayView()
        }
       </div>
    </div>
    </>
  )
}
