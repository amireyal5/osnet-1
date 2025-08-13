import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Bell,
  CheckCircle2,
  FileText,
  HelpCircle,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const tasks = [
  {
    id: 1,
    title: 'Follow up with John Doe',
    description: 'Regarding housing application status.',
    status: 'In Progress',
  },
  {
    id: 2,
    title: 'Schedule appointment for Jane Smith',
    description: 'For mental health counseling.',
    status: 'Pending',
  },
  {
    id: 3,
    title: 'Submit quarterly report',
    description: 'For Q2 program outcomes.',
    status: 'Completed',
  },
];

const activities = [
  {
    id: 1,
    user: 'You',
    action: 'updated the case file for',
    target: 'Jane Smith',
    time: '2 hours ago',
    avatar: 'JS',
  },
  {
    id: 2,
    user: 'AI Assistant',
    action: 'suggested new resources for',
    target: 'Mark Johnson',
    time: '5 hours ago',
    avatar: 'AI',
  },
  {
    id: 3,
    user: 'System',
    action: 'sent a reminder notification to',
    target: 'Emily White',
    time: '1 day ago',
    avatar: 'SYS',
  },
];

const notifications = [
  {
    id: 1,
    icon: Bell,
    title: 'Appointment Reminder',
    description: 'You have an upcoming appointment with John Doe tomorrow at 10 AM.',
    time: '1h ago'
  },
  {
    id: 2,
    icon: FileText,
    title: 'New Document Uploaded',
    description: 'A new document has been added to the case of "Family Support Initiative".',
    time: '3h ago'
  },
];


export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Dashboard" />
      <main className="flex-1 p-4 md:p-6 lg:p-8 grid gap-8 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>
                An overview of your current tasks and their statuses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {tasks.map((task) => (
                  <li key={task.id} className="flex items-start gap-4">
                    <CheckCircle2 className={`mt-1 h-5 w-5 ${task.status === 'Completed' ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                A log of recent actions within the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {activities.map((activity) => (
                  <li key={activity.id} className="flex items-center gap-4">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className={activity.user === 'AI Assistant' ? 'bg-primary text-primary-foreground' : ''}>{activity.avatar}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{activity.user}</span>{' '}
                      {activity.action}{' '}
                      <span className="font-medium text-foreground">{activity.target}</span>.
                    </p>
                    <span className="ml-auto text-xs text-muted-foreground">{activity.time}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
               <Button variant="link" className="p-0 h-auto -mt-1 ml-auto">
                <Link href="/notifications">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {notifications.map((notification) => (
                  <li key={notification.id} className="flex items-start gap-4">
                    <notification.icon className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                       <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="bg-primary text-primary-foreground">
             <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center gap-4">
               <HelpCircle className="w-12 h-12" />
               <CardDescription className="text-primary-foreground/80">
                Our AI-powered Resource Finder can help you find the right services for your clients' needs.
              </CardDescription>
              <Button variant="secondary" asChild>
                <Link href="/resources">Find Resources</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
