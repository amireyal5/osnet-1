
"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, CalendarPlus, MessageSquarePlus, Car, Forward } from "lucide-react";
import { SecurityVehicleRequestDialog } from "../vehicle-requests/SecurityVehicleRequestDialog";

export function QuickActions() {
    const [isVehicleRequestOpen, setIsVehicleRequestOpen] = useState(false);

    return (
        <>
        <Card className="h-full">
            <CardHeader>
                <CardTitle>פעולות מהירות</CardTitle>
                <CardDescription>גישה מהירה לפעולות הנפוצות ביותר.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
                <Button asChild variant="outline" className="h-16 flex-col gap-1 items-start p-4 text-right justify-center">
                    <Link href="/guests">
                        <div className="flex items-center gap-3">
                            <CalendarPlus className="h-6 w-6 text-primary" />
                            <div>
                                <p className="font-bold">פגישה חדשה</p>
                                <p className="text-xs text-muted-foreground">הוסף מוזמן חדש למערכת</p>
                            </div>
                        </div>
                    </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex-col gap-1 items-start p-4 text-right justify-center">
                     <Link href="/weekly-plan">
                        <div className="flex items-center gap-3">
                            <PlusCircle className="h-6 w-6 text-secondary" />
                            <div>
                                <p className="font-bold">עדכון תוכנית שבועית</p>
                                <p className="text-xs text-muted-foreground">עדכן את תוכנית העבודה שלך</p>
                            </div>
                        </div>
                    </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex-col gap-1 items-start p-4 text-right justify-center">
                    <Link href="/notifications">
                       <div className="flex items-center gap-3">
                            <MessageSquarePlus className="h-6 w-6 text-green-500" />
                            <div>
                                <p className="font-bold">הודעה חדשה</p>
                                <p className="text-xs text-muted-foreground">שלח הודעה או צור קבוצה</p>
                            </div>
                        </div>
                    </Link>
                </Button>
                 <Button variant="outline" className="h-16 flex-col gap-1 items-start p-4 text-right justify-center" onClick={() => setIsVehicleRequestOpen(true)}>
                    <div className="flex items-center gap-3">
                        <Car className="h-6 w-6 text-orange-500" />
                        <div>
                            <p className="font-bold">הזמנת רכב ביטחון</p>
                            <p className="text-xs text-muted-foreground">ליווי נסיעה בתפקיד</p>
                        </div>
                    </div>
                </Button>
                 <Button variant="outline" className="h-16 flex-col gap-1 items-start p-4 text-right justify-center" disabled>
                    <div className="flex items-center gap-3">
                        <Forward className="h-6 w-6 text-blue-500" />
                        <div>
                            <p className="font-bold">הפניות</p>
                            <p className="text-xs text-muted-foreground">בקרוב...</p>
                        </div>
                    </div>
                </Button>
            </CardContent>
        </Card>
        <SecurityVehicleRequestDialog open={isVehicleRequestOpen} onOpenChange={setIsVehicleRequestOpen} />
        </>
    );
}
