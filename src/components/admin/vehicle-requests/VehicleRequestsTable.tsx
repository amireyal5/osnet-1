
"use client";

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { VehicleRequest } from "@/hooks/use-vehicle-requests";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface VehicleRequestsTableProps {
  requests: VehicleRequest[];
  onUpdateStatus: (requestId: string, status: 'pending' | 'handled') => Promise<void>;
}

export function VehicleRequestsTable({ requests, onUpdateStatus }: VehicleRequestsTableProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleUpdate = async (request: VehicleRequest) => {
        setLoadingId(request.id);
        const newStatus = request.status === 'pending' ? 'handled' : 'pending';
        await onUpdateStatus(request.id, newStatus);
        setLoadingId(null);
    }

    return (
        <div className="border rounded-lg">
            <Table dir="rtl">
                <TableHeader>
                    <TableRow>
                        <TableHead>שם המבקש/ת</TableHead>
                        <TableHead>תאריך הגשה</TableHead>
                        <TableHead>תאריך נסיעה מבוקש</TableHead>
                        <TableHead>מטרה</TableHead>
                        <TableHead>כתובת</TableHead>
                        <TableHead>פעולות</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {requests.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">לא נמצאו בקשות.</TableCell>
                    </TableRow>
                ) : (
                    requests.map(request => (
                        <TableRow key={request.id} className={cn(request.status === 'handled' ? 'bg-green-100/50' : 'bg-red-100/50')}>
                            <TableCell className="font-medium">{request.userName}</TableCell>
                            <TableCell>{format(request.createdAt.toDate(), 'd MMMM yyyy, HH:mm', { locale: he })}</TableCell>
                            <TableCell>{format(request.startDateTime.toDate(), 'd MMMM yyyy, HH:mm', { locale: he })}</TableCell>
                            <TableCell>{request.purpose}</TableCell>
                            <TableCell>{request.address}</TableCell>
                            <TableCell>
                                <Button
                                    size="sm"
                                    onClick={() => handleUpdate(request)}
                                    disabled={loadingId === request.id}
                                    variant={request.status === 'handled' ? 'secondary' : 'default'}
                                >
                                    {loadingId === request.id ? <Loader2 className="animate-spin" /> : <Check className="me-2 h-4 w-4" />}
                                    {request.status === 'pending' ? 'סמן כטופל' : 'החזר לממתין'}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
        </div>
    );
}
