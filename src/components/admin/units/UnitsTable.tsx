
"use client";

import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Unit } from '@/hooks/use-units';
import { useUsers } from '@/hooks/use-users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";


interface UnitsTableProps {
  units: Unit[];
  onEdit: (unit: Unit) => void;
}

const getInitials = (name: string = '') => {
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0]?.charAt(0) ?? ''}${parts[parts.length - 1]?.charAt(0) ?? ''}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
};


export function UnitsTable({ units, onEdit }: UnitsTableProps) {
    const { users } = useUsers();
    
    const usersById = useMemo(() => {
        return users.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
        }, {} as Record<string, typeof users[0]>);
    }, [users]);


    return (
        <div className="border rounded-lg">
            <Table dir="rtl">
                <TableHeader>
                    <TableRow>
                        <TableHead>שם היחידה</TableHead>
                        <TableHead>רכז היחידה</TableHead>
                        <TableHead>עובדי היחידה</TableHead>
                        <TableHead>פעולות</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {units.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">לא נמצאו יחידות.</TableCell>
                    </TableRow>
                ) : (
                    units.map(unit => {
                        const coordinator = unit.coordinatorId ? usersById[unit.coordinatorId] : null;
                        const members = (unit.memberIds || []).map(id => usersById[id]).filter(Boolean);

                        return (
                            <TableRow key={unit.id}>
                                <TableCell className="font-medium">{unit.name}</TableCell>
                                <TableCell>
                                    {coordinator ? (
                                         <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={coordinator.photoURL || undefined} />
                                                <AvatarFallback>{getInitials(`${coordinator.firstName} ${coordinator.lastName}`)}</AvatarFallback>
                                            </Avatar>
                                            <span>{coordinator.firstName} {coordinator.lastName}</span>
                                        </div>
                                    ) : 'לא שויך'}
                                </TableCell>
                                <TableCell>
                                     <div className="flex -space-x-2 rtl:space-x-reverse overflow-hidden">
                                        <TooltipProvider>
                                        {members.slice(0, 5).map(member => (
                                            <Tooltip key={member.id}>
                                                <TooltipTrigger asChild>
                                                    <Avatar className="h-8 w-8 border-2 border-background">
                                                        <AvatarImage src={member.photoURL || undefined} />
                                                        <AvatarFallback>{getInitials(`${member.firstName} ${member.lastName}`)}</AvatarFallback>
                                                    </Avatar>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{member.firstName} {member.lastName}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ))}
                                        {members.length > 5 && (
                                             <Tooltip>
                                                 <TooltipTrigger asChild>
                                                    <div className="flex items-center justify-center w-8 h-8 text-xs font-medium text-white bg-muted-foreground border-2 border-background rounded-full hover:bg-gray-600">
                                                        +{members.length - 5}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>ועוד {members.length - 5} עובדים</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                        </TooltipProvider>
                                     </div>
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(unit)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })
                )}
                </TableBody>
            </Table>
        </div>
    );
}
