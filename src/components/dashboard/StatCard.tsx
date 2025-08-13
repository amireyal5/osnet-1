"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from 'next/link';
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  Icon: React.ElementType;
  isLoading: boolean;
  href?: string;
  className?: string;
  valueClassName?: string;
  description?: string;
}

export function StatCard({ title, value, Icon, isLoading, href, className, valueClassName, description }: StatCardProps) {
  
  const cardContent = (
    <Card dir="rtl" className={cn("hover:bg-muted/50 transition-colors", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center pt-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );

  if (href && !isLoading) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
}
