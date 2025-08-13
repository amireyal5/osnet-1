import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfilePage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Profile" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              Manage your personal information and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="https://placehold.co/100x100.png" alt="User avatar" data-ai-hint="person" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">Jane Doe</h3>
                <p className="text-muted-foreground">Case Manager</p>
                 <Button variant="outline" size="sm" className="mt-2">Change Picture</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" defaultValue="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="jane.doe@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" defaultValue="Case Manager" disabled />
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t">
                 <h4 className="font-medium">Notification Preferences</h4>
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive important updates via email.</p>
                    </div>
                    <Switch id="email-notifications" defaultChecked />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Get real-time alerts on your devices.</p>
                    </div>
                    <Switch id="push-notifications" />
                </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="ml-auto bg-accent hover:bg-accent/90">Save Changes</Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
