'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  Bell,
  LayoutDashboard,
  User,
  Wrench,
  HeartHandshake,
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cases', label: 'Case Management', icon: Briefcase },
  { href: '/resources', label: 'Resource Finder', icon: Wrench },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

export default function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 p-2">
          <div className="p-2 rounded-lg bg-primary text-primary-foreground">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold font-headline leading-tight">CivicConnect</h2>
            <p className="text-xs text-muted-foreground">Social Services CRM</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-0">
        <SidebarMenu className="p-2">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.href)}
                  tooltip={{ children: item.label, side: 'right' }}
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-0">
        <SidebarSeparator />
        <SidebarMenu className="p-2">
          <SidebarMenuItem>
            <Link href="/profile" passHref legacyBehavior>
              <SidebarMenuButton
                asChild
                isActive={isActive('/profile')}
                tooltip={{ children: 'Profile', side: 'right' }}
              >
                <a>
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold">Jane Doe</span>
                    <span className="text-xs text-muted-foreground">Case Manager</span>
                  </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
