
"use client";

import { MainLayout } from "@/components/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useUsers } from "@/hooks/use-users";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const themes = [
    { name: "יער גשם", id: "forest", primary: "hsl(158, 78%, 39%)", background: "hsl(100, 60%, 96%)" },
    { name: "שקיעה מדברית", id: "desert", primary: "hsl(25, 84%, 60%)", background: "hsl(39, 70%, 95%)" },
    { name: "אוקיינוס כחול", id: "ocean", primary: "hsl(210, 85%, 55%)", background: "hsl(210, 100%, 97%)" },
    { name: "שדה לבנדר", id: "lavender", primary: "hsl(260, 60%, 65%)", background: "hsl(255, 100%, 97%)" },
    { name: "פריחת הדובדבן", id: "sakura", primary: "hsl(340, 82%, 75%)", background: "hsl(345, 100%, 97%)" },
    { name: "נקי ולבן", id: "clean_white", primary: "hsl(var(--primary))", background: "hsl(0 0% 100%)" },
];

export default function SettingsPage() {
    const { userProfile } = useUserProfile();
    const { updateUser } = useUsers();

    const handleThemeChange = (themeId: string) => {
        if (userProfile) {
            updateUser(userProfile.id, { theme: themeId });
        }
    };

    return (
        <MainLayout>
            <div className="max-w-3xl mx-auto flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-headline">הגדרות מערכת</CardTitle>
                        <CardDescription>
                            התאם אישית את חווית השימוש שלך במערכת.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <h3 className="font-semibold">בחר ערכת נושא</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {themes.map((theme) => {
                                    const isSelected = userProfile?.theme === theme.id || (!userProfile?.theme && theme.id === 'forest');
                                    return (
                                        <div key={theme.id} onClick={() => handleThemeChange(theme.id)} className="cursor-pointer">
                                            <div className={cn("w-full h-24 rounded-lg flex items-center justify-center relative border-2", isSelected ? 'border-primary' : 'border-transparent')}>
                                                 <div className="absolute inset-0.5 rounded-md" style={{ backgroundColor: theme.background }}>
                                                    <div 
                                                        className="absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg" 
                                                        style={{ backgroundColor: theme.primary }}
                                                    />
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                                        <Check size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-center mt-2 text-sm font-medium">{theme.name}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
