
"use client";

import { useMemo, useState } from 'react';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    SortingState,
    getSortedRowModel,
    ColumnFiltersState,
    getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserProfile, UserRole } from '@/hooks/use-user-profile';
import { useTeams } from '@/hooks/use-teams';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Input } from '@/components/ui/input';

interface UsersTableProps {
  users: UserProfile[];
}

const getInitials = (name: string = '') => {
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0]?.charAt(0) ?? ''}${parts[parts.length - 1]?.charAt(0) ?? ''}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
};

const getStatusVariant = (status: string) => {
    switch (status) {
      case "פעיל": return "bg-green-100 text-green-800 border-green-200";
      case "ממתין לאישור": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "מושבת": return "bg-red-100 text-red-800 border-red-200";
      default: return "";
    }
};

const getRoleVariant = (role: UserRole) => {
    switch (role) {
      case "מנהל מערכת": return "bg-destructive/80 text-destructive-foreground";
      case "ראש מנהל": return "bg-purple-600 text-white";
      case "ראש צוות": return "bg-blue-600 text-white";
      default: return "secondary";
    }
};

export function UsersTable({ users }: UsersTableProps) {
    const { teams } = useTeams();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const userTeamsMap = useMemo(() => {
        const map = new Map<string, string[]>();
        if (!teams || teams.length === 0) return map;

        users.forEach(user => {
            map.set(user.id, []);
        });

        teams.forEach(team => {
            team.memberIds?.forEach(memberId => {
                const memberTeams = map.get(memberId) || [];
                 if (!memberTeams.includes(team.name)) {
                    memberTeams.push(team.name);
                    map.set(memberId, memberTeams);
                }
            });
        });
        return map;
    }, [users, teams]);

    const data = useMemo(() => {
        // Sort by status first ('ממתין לאישור' on top), then by creation date
        return [...users].sort((a, b) => {
            if (a.status === 'ממתין לאישור' && b.status !== 'ממתין לאישור') return -1;
            if (a.status !== 'ממתין לאישור' && b.status === 'ממתין לאישור') return 1;
            return (b.createdAt?.toDate() || 0) > (a.createdAt?.toDate() || 0) ? 1 : -1;
        });
    }, [users]);
    
    const columns: ColumnDef<UserProfile>[] = [
        {
            accessorKey: "fullName",
            header: "שם",
            cell: ({ row }) => {
                const user = row.original;
                const fullName = `${user.firstName} ${user.lastName}`;
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={user.photoURL} />
                            <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{fullName}</div>
                    </div>
                )
            }
        },
        {
            accessorKey: "email",
            header: "אימייל",
        },
        {
            accessorKey: "center",
            header: "מרכז",
            cell: ({ row }) => row.original.center || 'לא שויך',
        },
        {
            accessorKey: "roles",
            header: "תפקידים",
            cell: ({ row }) => {
                 const roles = Array.isArray(row.original.roles) ? row.original.roles : [];
                 return (
                    <div className="flex flex-wrap gap-1">
                        {roles.length > 0 ? roles.map((role, index) => (
                            <Badge key={`${row.original.id}-role-${index}`} variant="secondary" className={cn("font-normal", getRoleVariant(role))}>{role}</Badge>
                        )) : (
                            <span className="text-xs text-muted-foreground">לא שויך</span>
                        )}
                    </div>
                )
            }
        },
        {
            id: "teams",
            header: "צוותים",
            cell: ({ row }) => {
                const teams = userTeamsMap.get(row.original.id) || [];
                return (
                    <div className="flex flex-wrap gap-1">
                        {teams.length > 0 ? teams.map((teamName, index) => (
                            <Badge key={`${row.original.id}-team-${index}`} variant="outline">{teamName}</Badge>
                        )) : (
                            <span className="text-xs text-muted-foreground">ללא שיוך</span>
                        )}
                    </div>
                )
            }
        },
        {
            accessorKey: "status",
            header: "סטטוס",
            cell: ({ row }) => (
                <Badge className={getStatusVariant(row.original.status)}>{row.original.status}</Badge>
            )
        },
        {
            id: "actions",
            header: "פעולות",
            cell: ({ row }) => (
                 <Button asChild variant="ghost" size="icon">
                    <Link href={`/admin/users/${row.original.id}`}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">ערוך משתמש</span>
                    </Link>
                </Button>
            )
        }
    ]

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        }
    });

    return (
        <div className="flex flex-col gap-4">
             <div className="flex items-center">
                <Input
                    placeholder="חפש לפי שם מלא..."
                    value={(table.getColumn("fullName")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("fullName")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
            </div>
            <div className="border rounded-lg">
                <Table dir="rtl">
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder ? null : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map(row => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map(cell => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    לא נמצאו תוצאות.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
