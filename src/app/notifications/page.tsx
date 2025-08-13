import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Bell, AlertTriangle, Info, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Notification = {
  id: number;
  type: 'reminder' | 'alert' | 'info' | 'document';
  title: string;
  description: string;
  timestamp: string;
};

const notifications: Notification[] = [
  {
    id: 1,
    type: 'reminder',
    title: 'Upcoming Appointment',
    description: "Reminder: You have an appointment with Jane Smith tomorrow at 10:00 AM.",
    timestamp: '2 hours ago',
  },
  {
    id: 2,
    type: 'alert',
    title: 'Urgent Action Required',
    description: "John Doe's case file is missing critical documentation. Please update as soon as possible.",
    timestamp: '1 day ago',
  },
  {
    id: 3,
    type: 'info',
    title: 'System Update',
    description: 'A new version of the reporting module is now available. Please explore the new features.',
    timestamp: '3 days ago',
  },
  {
    id: 4,
    type: 'document',
    title: 'New Document Received',
    description: "A new document has been uploaded for Mark Johnson's housing application.",
    timestamp: '4 days ago',
  },
    {
    id: 5,
    type: 'reminder',
    title: 'Quarterly Report Due',
    description: "Your Q2 performance report is due at the end of this week.",
    timestamp: '5 days ago',
  },
];

const notificationIcons: Record<Notification['type'], LucideIcon> = {
  reminder: Bell,
  alert: AlertTriangle,
  info: Info,
  document: FileText,
};

const notificationColors: Record<Notification['type'], string> = {
    reminder: 'text-blue-500',
    alert: 'text-red-500',
    info: 'text-gray-500',
    document: 'text-green-500',
}

export default function NotificationsPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Notifications" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
            <CardDescription>
              Review all your notifications, reminders, and escalations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type];
                return (
                  <div key={notification.id} className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className={`p-2 rounded-full bg-muted ${notificationColors[notification.type]}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground">{notification.timestamp}</p>
                      </div>
                      <p className="text-muted-foreground mt-1">{notification.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
