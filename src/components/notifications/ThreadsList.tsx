
"use client";

import { Thread, useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { he } from 'date-fns/locale';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { MoreHorizontal, Archive } from "lucide-react";

interface ThreadsListProps {
  threads: Thread[];
  selectedThreadId: string | undefined;
  onThreadSelect: (threadId: string) => void;
  onHideThread: (threadId: string) => void;
}

const getInitials = (name: string = '') => {
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
};

export function ThreadsList({ threads, selectedThreadId, onThreadSelect, onHideThread }: ThreadsListProps) {
    const [user] = useAuthState(auth);

    if (!user) return null;

    const getOtherParticipants = (thread: Thread) => {
        return thread.participantIds
            .filter(id => id !== user.uid)
            .map(id => thread.participants[id]);
    };

    const getThreadDisplayName = (thread: Thread) => {
        if (thread.title) return thread.title;
        const others = getOtherParticipants(thread);
        if (others.length === 0) return "שיחה עצמית";
        return others.map(p => `${p.firstName} ${p.lastName}`).join(', ');
    };

    const getThreadAvatar = (thread: Thread) => {
        const others = getOtherParticipants(thread);
        if (others.length === 1) return others[0].photoURL;
        return undefined; // Group avatar logic can be added here
    };

    return (
        <div className="flex-1 overflow-y-auto">
            <nav className="p-2 space-y-1">
                {threads.map(thread => (
                    <div key={thread.id} className="relative group">
                        <button
                            onClick={() => onThreadSelect(thread.id)}
                            className={cn(
                                "w-full text-right flex items-center gap-3 p-2 rounded-lg transition-colors",
                                selectedThreadId === thread.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                            )}
                        >
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={getThreadAvatar(thread)} alt="avatar" />
                                <AvatarFallback>{getInitials(getThreadDisplayName(thread))}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 truncate">
                                <p className="font-semibold truncate">{getThreadDisplayName(thread)}</p>
                                <p className="text-sm text-muted-foreground truncate">{thread.lastMessageContent}</p>
                            </div>
                            <div className="flex flex-col items-end text-xs text-muted-foreground">
                                <span>
                                    {thread.lastMessageTimestamp && formatDistanceToNow(thread.lastMessageTimestamp.toDate(), { addSuffix: true, locale: he })}
                                </span>
                                {user.uid && thread.unreadCounts[user.uid] > 0 && (
                                    <span className="mt-1 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                                        {thread.unreadCounts[user.uid]}
                                    </span>
                                )}
                            </div>
                        </button>
                         <div className="absolute top-1/2 -translate-y-1/2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal size={16} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={() => onHideThread(thread.id)}>
                                        <Archive size={14} className="me-2" />
                                        הסתר שיחה
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                         </div>
                    </div>
                ))}
            </nav>
        </div>
    );
}
