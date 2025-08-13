
"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Home,
  PanelLeft,
  Search,
  Users,
  Settings,
  ClipboardCheck,
  Bell,
  MessageSquare,
  UserCheck,
  Users2,
  Building,
  ClipboardList,
  Mail,
  Car,
  CalendarClock,
  LayoutGrid,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { useAuthState } from "react-firebase-hooks/auth"
import { doc, getDoc } from "firebase/firestore"

import { auth, db } from "@/lib/firebase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { UserNav } from "@/components/user-nav"
import { useUserProfile, UserProfile, USER_ROLES, UserRole } from "@/hooks/use-user-profile"
import { useNotifications } from "@/hooks/use-notifications"


function Logo() {
  return (
    <svg 
        className="h-8 w-auto text-primary" 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4Z" fill="currentColor" />
        <path d="M31 18C31 21.866 27.866 25 24 25C20.134 25 17 21.866 17 18C17 14.134 20.134 11 24 11C27.866 11 31 14.134 31 18Z" fill="white" />
        <path d="M14 34C14 29.5817 17.5817 26 22 26H26C30.4183 26 34 29.5817 34 34V37H14V34Z" fill="white" />
    </svg>
  );
}

const universalNavItems = (roles: UserRole[] = []) => {
    let items = [
        { href: "/dashboard", icon: Home, label: "לוח בקרה" },
        { href: "/weekly-plan", icon: ClipboardCheck, label: "תוכנית שבועית" },
        { href: "/guests", icon: UserCheck, label: "מוזמנים" },
        { href: "/notifications", icon: MessageSquare, label: "הודעות" },
    ];
    
    // Show surveys link only to specific roles
    if (roles.some(r => [USER_ROLES.ADMIN, USER_ROLES.GENERAL_MANAGER, USER_ROLES.TEAM_LEAD, USER_ROLES.ACCOUNTANT].includes(r))) {
        items.push({ href: "/surveys", icon: ClipboardList, label: "סקרים" });
    }
    
    return items;
};

const roleBasedNavItems = (roles: UserRole[] = []) => {
    const items: { label: string, subItems: any[] }[] = [];
    
    const dailyAttendanceLink = { href: "/daily-attendance", icon: CalendarClock, label: "נוכחות יומית" };
    const roomManagementLink = { href: "/rooms", icon: LayoutGrid, label: "ניהול חדרים" };
    
    const adminItems = [];
    if (roles.includes(USER_ROLES.ADMIN)) {
        adminItems.push(
            { href: "/admin/users", icon: Users, label: "ניהול משתמשים" },
            { href: "/admin/teams", icon: Users2, label: "ניהול צוותים" },
            { href: "/admin/units", icon: Building, label: "ניהול יחידות" },
            { href: "/admin/vehicle-requests", icon: Car, label: "בקשות רכב" },
            dailyAttendanceLink
        );
    }
    if (adminItems.length > 0) {
        items.push({ label: "ניהול מערכת", subItems: adminItems });
    }

    const generalManagerItems = [];
    if (roles.includes(USER_ROLES.GENERAL_MANAGER)) {
         generalManagerItems.push(
             { href: "/admin/vehicle-requests", icon: Car, label: "בקשות רכב" },
             dailyAttendanceLink
         );
    }
    if (generalManagerItems.length > 0) {
        items.push({ label: "ראש מנהל", subItems: generalManagerItems });
    }
    
    const teamLeadItems = [];
    if (roles.includes(USER_ROLES.TEAM_LEAD)) {
        teamLeadItems.push(dailyAttendanceLink);
    }
     if (teamLeadItems.length > 0) {
        items.push({ label: "ראש צוות", subItems: teamLeadItems });
    }
    
    const accountantItems = [];
    if (roles.includes(USER_ROLES.ACCOUNTANT)) {
        accountantItems.push(dailyAttendanceLink, roomManagementLink);
    }
     if (accountantItems.length > 0) {
        items.push({ label: "תחשיבנית", subItems: accountantItems });
    }
    
    const secretaryItems = [];
    if (roles.includes(USER_ROLES.SECRETARY)) {
        secretaryItems.push(roomManagementLink);
    }
    if (secretaryItems.length > 0) {
        items.push({ label: "מזכירות", subItems: secretaryItems });
    }
    
    const securityItems = [];
    if (roles.includes(USER_ROLES.SECURITY)) {
        securityItems.push(dailyAttendanceLink, roomManagementLink);
    }
    if (securityItems.length > 0) {
        items.push({ label: "אבטחה", subItems: securityItems });
    }

    return items;
}


function SidebarNav({ roles, pathname, unreadCount }: { roles: string[], pathname: string, unreadCount: number }) {
    const navs = universalNavItems(roles as UserRole[]);
    const roleNavs = roleBasedNavItems(roles as UserRole[]);
    
    const isSecurity = roles.includes(USER_ROLES.SECURITY);

    // Filter out 'Weekly Plan' for security
    const finalNavs = isSecurity ? navs.filter(item => item.href !== '/weekly-plan') : navs;

    return (
        <nav className="flex flex-col items-stretch gap-2 px-4 mt-6 text-right">
          {finalNavs.map((item) => {
            const isNotifications = item.href === '/notifications';
            return (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn("flex w-full items-center justify-start gap-4 rounded-lg px-4 py-3 text-lg text-foreground transition-colors hover:bg-black/5 relative", {
                    "bg-primary/10 text-primary font-bold": pathname.startsWith(item.href)
                    })}
                >
                    <item.icon className="h-6 w-6" />
                    <span>{item.label}</span>
                     {isNotifications && unreadCount > 0 && (
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs">
                            {unreadCount}
                        </span>
                    )}
                </Link>
            )
          })}
          
          {(roleNavs.length > 0) && (
             <div className="flex flex-col gap-2">
                   <div className="h-px w-full bg-border my-2" />
                  {roleNavs.map(group => (
                    <React.Fragment key={group.label}>
                      <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</h3>
                      {group.subItems.map(subItem => (
                         <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={cn("flex w-full items-center justify-start gap-4 rounded-lg px-4 py-3 text-lg text-foreground transition-colors hover:bg-black/5", {
                              "bg-primary/10 text-primary font-bold": pathname.startsWith(subItem.href)
                            })}
                          >
                            <subItem.icon className="h-6 w-6" />
                            <span>{subItem.label}</span>
                          </Link>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
          )}
        </nav>
    );
}

function MobileNav({ roles, unreadCount }: { roles: UserRole[], unreadCount: number }) {
    const pathname = usePathname()
    const isSecurity = roles.includes(USER_ROLES.SECURITY);
    const navItems = isSecurity 
        ? universalNavItems(roles).filter(item => item.href !== '/weekly-plan')
        : universalNavItems(roles);

    return (
        <div className="fixed bottom-0 start-0 z-50 w-full h-16 bg-card border-t md:hidden">
            <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
                 {navItems.slice(0, 5).map(item => {
                     const isActive = pathname.startsWith(item.href!);
                     const isNotifications = item.href === '/notifications';
                     return (
                        <button
                            key={item.href}
                            onClick={() => window.location.href = item.href!}
                            className={cn("inline-flex flex-col items-center justify-center px-2 hover:bg-muted group relative", {
                                "text-primary": isActive
                            })}
                        >
                             {isNotifications && unreadCount > 0 && (
                                <span className="absolute top-1 right-1/2 translate-x-3 h-4 w-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px]">
                                    {unreadCount}
                                </span>
                            )}
                            <item.icon className={cn("w-6 h-6 mb-1 text-muted-foreground group-hover:text-foreground", {"text-primary": isActive})} />
                            <span className={cn("text-xs text-muted-foreground group-hover:text-foreground", {"text-primary": isActive})}>{item.label}</span>
                        </button>
                     )
                 })}
            </div>
        </div>
    )
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { userProfile, isLoading } = useUserProfile();
  const { threads } = useNotifications();

  const totalUnreadCount = useMemo(() => {
    if (!userProfile) return 0;
    return threads.reduce((acc, thread) => {
        return acc + (thread.unreadCounts[userProfile.id] || 0);
    }, 0);
  }, [threads, userProfile]);

  if (isLoading || !userProfile) {
    return <div className="flex h-screen w-full items-center justify-center">טוען...</div>
  }

  return (
    <div className="flex min-h-screen w-full flex-row-reverse bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-[240px] flex-col border-l bg-[#F5F6F8] md:flex shrink-0 fixed top-0 right-0 h-full z-40">
        <div className="flex h-[64px] items-center gap-2 border-b px-4">
            <Logo />
            <span className="text-xl font-bold font-headline">עו"סנט</span>
        </div>
        <SidebarNav roles={userProfile.roles || []} pathname={pathname} unreadCount={totalUnreadCount} />
        <div className="mt-auto p-4">
            <Link
                href="/settings"
                className="flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2 text-foreground transition-colors hover:bg-black/5"
            >
                <Settings className="h-6 w-6 text-gray-500" />
                <span>הגדרות</span>
            </Link>
        </div>
      </aside>

      <div className="flex flex-col w-full flex-1 md:mr-[240px] pb-16 md:pb-0">
        <header className="sticky top-0 z-30 flex h-[64px] items-center justify-between gap-4 border-b bg-card px-4 md:px-6 shadow-sm">
          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="md:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">פתח תפריט</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-xs bg-[#F5F6F8]">
               <SheetHeader>
                  <SheetTitle className="flex flex-col items-center gap-2 mb-4 text-center">
                    <Logo />
                    <h1 className="text-2xl font-bold font-headline">עו"סנט</h1>
                  </SheetTitle>
              </SheetHeader>
              <nav className="grid gap-6 text-lg font-medium text-right mt-8">
                 <SidebarNav roles={userProfile.roles || []} pathname={pathname} unreadCount={totalUnreadCount} />
              </nav>
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
            <div className="relative flex-1 md:grow-0 max-w-sm">
                <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="חיפוש..."
                className="w-full rounded-lg bg-muted pr-8"
                />
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
                <span className="sr-only">התראות</span>
            </Button>
            <UserNav />
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-background">
             <div className="h-full w-full mx-auto max-w-7xl p-4 md:p-6">
                {children}
            </div>
        </main>
      </div>
      <MobileNav roles={userProfile.roles} unreadCount={totalUnreadCount} />
    </div>
  )
}

    