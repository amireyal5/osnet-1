
"use client";

import { MainLayout } from "@/components/main-layout";
import { useAuthCheck } from "@/hooks/use-auth-check";
import { useNotifications } from "@/hooks/use-notifications";
import { ThreadsList } from "@/components/notifications/ThreadsList";
import { ConversationView } from "@/components/notifications/ConversationView";
import { SendNotificationForm } from "@/components/notifications/SendNotificationForm";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, Loader2, PenSquare, ArrowRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
    useAuthCheck();
    const { 
        threads, 
        selectedThread, 
        setSelectedThread,
        messages, 
        isLoading, 
        loadMoreMessages, 
        hasMoreMessages, 
        handleSendMessage, 
        handleCreateThread,
        handleDeleteMessage,
        handleHideThread,
        handleTyping,
    } = useNotifications();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleThreadSelect = (threadId: string) => {
        const thread = threads.find(t => t.id === threadId);
        if (thread) {
            setSelectedThread(thread);
        }
    };

    return (
        <MainLayout>
            <div className="h-dvh md:h-[calc(100vh-100px)] md:border md:rounded-lg bg-card text-card-foreground md:shadow-sm flex flex-row overflow-hidden">
                <aside className={cn(
                    "w-full md:w-1/3 border-e flex flex-col transition-transform duration-300 h-full",
                    selectedThread && "hidden md:flex"
                )}>
                    <div className="p-4 border-b flex items-center justify-between shrink-0">
                        <h2 className="text-xl font-bold font-headline">שיחות</h2>
                        <Button variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(true)}>
                           <PenSquare />
                        </Button>
                    </div>

                    <SendNotificationForm
                        isOpen={isCreateModalOpen}
                        onOpenChange={setIsCreateModalOpen}
                        onCreateThread={handleCreateThread}
                    />

                    {isLoading.threads ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : (
                        <ThreadsList 
                            threads={threads} 
                            selectedThreadId={selectedThread?.id}
                            onThreadSelect={handleThreadSelect}
                            onHideThread={handleHideThread}
                        />
                    )}
                </aside>
                <main className={cn(
                    "w-full md:w-2/3 flex flex-col flex-1 transition-transform duration-300 h-full",
                    !selectedThread && "hidden md:flex"
                )}>
                    {selectedThread ? (
                        <ConversationView 
                            key={selectedThread.id}
                            thread={selectedThread}
                            messages={messages}
                            isLoading={isLoading.messages}
                            onSendMessage={handleSendMessage}
                            loadMoreMessages={loadMoreMessages}
                            hasMoreMessages={hasMoreMessages}
                            onDeleteMessage={(messageId) => handleDeleteMessage(selectedThread.id, messageId)}
                            onBack={() => setSelectedThread(null)}
                            onTyping={() => handleTyping(selectedThread.id)}
                        />
                    ) : (
                        <div className="hidden md:flex flex-1 items-center justify-center">
                            <div className="text-center text-muted-foreground">
                                <MessageSquarePlus size={48} className="mx-auto" />
                                <p>בחר שיחה או צור אחת חדשה</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </MainLayout>
    );
}
