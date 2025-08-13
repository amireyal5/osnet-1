
"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Message, Thread, UserProfile } from "@/hooks/use-notifications";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Loader2, Paperclip, Send, X, File as FileIcon, Download, MoreVertical, Trash2, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '../ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { storage } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversationViewProps {
    thread: Thread;
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (content: string, contentType: Message['contentType'], fileURL?: string, fileName?: string) => void;
    loadMoreMessages: () => void;
    hasMoreMessages: boolean;
    onDeleteMessage: (messageId: string) => void;
    onBack: () => void;
    onTyping: () => void;
}

interface UploadProgress {
    progress: number;
    fileName: string;
}

export function ConversationView({ thread, messages, isLoading, onSendMessage, loadMoreMessages, hasMoreMessages, onDeleteMessage, onBack, onTyping }: ConversationViewProps) {
    const [user] = useAuthState(auth);
    const [newMessage, setNewMessage] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = (behavior: 'smooth' | 'auto' = 'auto') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        // Instant scroll on initial load, smooth for new messages
        scrollToBottom('auto');
    }, [thread.id]); // Rerun on thread change

    useEffect(() => {
        if(messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if(lastMessage.senderId === user?.uid) {
                scrollToBottom('smooth');
            }
        }
    }, [messages, user?.uid]);


    const handleScroll = () => {
        if (messagesContainerRef.current?.scrollTop === 0 && hasMoreMessages && !isLoading) {
            loadMoreMessages();
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB
                toast({ title: "קובץ גדול מדי", description: "הקובץ חייב להיות קטן מ-5MB.", variant: 'destructive' });
                return;
            }
            setAttachment(file);
        }
    };

    const handleUploadAndSend = () => {
        if (!attachment || !user) return;
        
        const storageRef = ref(storage, `threads/${thread.id}/${user.uid}/${Date.now()}_${attachment.name}`);
        const uploadTask = uploadBytesResumable(storageRef, attachment);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress({ progress, fileName: attachment.name });
            }, 
            (error) => {
                console.error("Upload error", error);
                toast({ title: "שגיאת העלאה", description: "לא ניתן להעלות את הקובץ. ודא שהקובץ קטן מ-5MB", variant: "destructive" });
                setUploadProgress(null);
                setAttachment(null);
            }, 
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    const contentType: Message['contentType'] = attachment.type.startsWith('image/') ? 'image' : 'file';
                    onSendMessage(newMessage || attachment.name, contentType, downloadURL, attachment.name);
                    setNewMessage("");
                    setAttachment(null);
                    setUploadProgress(null);
                });
            }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (attachment) {
            handleUploadAndSend();
        } else if (newMessage.trim()) {
            onSendMessage(newMessage.trim(), 'text');
            setNewMessage("");
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        onTyping();
    }

    const getInitials = (name: string = '') => {
        const parts = name.split(' ');
        if (parts.length > 1) {
            return `${parts[0]?.charAt(0) ?? ''}${parts[parts.length - 1]?.charAt(0) ?? ''}`.toUpperCase();
        }
        return name.charAt(0).toUpperCase();
    };

    const { conversationTitle, conversationSubtitle, typingUsersText } = useMemo(() => {
        if (!user) return { conversationTitle: '', conversationSubtitle: '', typingUsersText: null };

        let title = '';
        let subtitle = '';
        
        const otherParticipants = thread.participantIds
            .filter(id => id !== user.uid)
            .map(id => thread.participants[id]);

        if (thread.title) {
            title = thread.title;
            subtitle = Object.values(thread.participants)
                .map(p => p.firstName)
                .join(', ');
        } else if (otherParticipants.length === 1 && otherParticipants[0]) {
            const otherUser = otherParticipants[0];
            title = `${otherUser.firstName} ${otherUser.lastName}`;
            subtitle = ''; 
        } else {
            title = 'שיחה';
            subtitle = otherParticipants.map(p => p?.firstName).join(', ');
        }
        
        const currentTypingUsers = (thread.typingUsers || [])
            .filter(id => id !== user.uid)
            .map(id => thread.participants[id]?.firstName)
            .filter(Boolean);
            
        let typingText = null;
        if (currentTypingUsers.length === 1) {
            typingText = `${currentTypingUsers[0]} מקליד/ה...`;
        } else if (currentTypingUsers.length > 1) {
            typingText = `${currentTypingUsers.join(', ')} מקלידים...`;
        }

        return { conversationTitle: title, conversationSubtitle: subtitle, typingUsersText: typingText };

    }, [thread, user]);

    return (
        <div className="grid h-full grid-rows-[auto_1fr_auto]">
            <header className="p-4 border-b flex items-center gap-4 shrink-0 bg-background/95 backdrop-blur-sm z-10">
                 <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                    <ArrowRight />
                </Button>
                <Avatar>
                    <AvatarFallback>{getInitials(conversationTitle)}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-bold">{conversationTitle}</h3>
                    {conversationSubtitle && <p className="text-sm text-muted-foreground truncate">{conversationSubtitle}</p>}
                </div>
            </header>
            
            <div className="relative overflow-hidden bg-muted/30">
                <div ref={messagesContainerRef} onScroll={handleScroll} className="absolute inset-0 p-4 overflow-y-auto">
                    {isLoading && messages.length === 0 && <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>}
                    {hasMoreMessages && <div className="text-center text-sm p-2">טוען הודעות קודמות...</div>}

                    <div className="space-y-4">
                        {messages.map(message => {
                            const isSender = message.senderId === user?.uid;
                            const senderProfile = thread.participants[message.senderId];
                            const senderName = senderProfile ? `${senderProfile.firstName} ${senderProfile.lastName}` : "משתמש לא ידוע";
                            
                            return (
                                <div key={message.id} className={cn("flex items-end gap-2 group", isSender ? "justify-end" : "justify-start")}>
                                    {isSender && (
                                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <MoreVertical size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem 
                                                        onClick={() => onDeleteMessage(message.id)} 
                                                        className="text-destructive focus:text-destructive cursor-pointer"
                                                    >
                                                        <Trash2 size={14} className="me-2" />
                                                        מחק
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    )}
                                    <div className={cn("flex items-start gap-3", isSender && "flex-row-reverse")}>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={senderProfile?.photoURL} />
                                            <AvatarFallback>{getInitials(senderName)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            {!isSender && <p className="text-xs font-bold mb-1 text-right">{senderName}</p>}
                                            <div className={cn(
                                                "p-3 rounded-2xl shadow-sm max-w-xs md:max-w-md text-base", 
                                                isSender ? "bg-primary text-primary-foreground rounded-br-lg" : "bg-background rounded-bl-lg",
                                                message.status === 'deleted' && 'bg-gray-100 text-gray-500 italic'
                                            )}>
                                                {message.contentType === 'text' && <p className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br />') }} />}
                                                {message.contentType === 'image' && message.fileURL && <img src={message.fileURL} alt={message.fileName || 'תמונה'} className="rounded-md max-h-60" />}
                                                {message.contentType === 'file' && message.fileURL && (
                                                    <a href={message.fileURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/10 rounded-md hover:bg-black/20">
                                                        <FileIcon className="h-6 w-6" />
                                                        <span className="truncate flex-1">{message.fileName}</span>
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                )}
                                                <p className={cn("text-xs mt-1 opacity-70", isSender ? "text-left" : "text-right")}>
                                                    {message.timestamp && format(message.timestamp.toDate(), 'HH:mm')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div ref={messagesEndRef} />
                </div>
                 <AnimatePresence>
                    {typingUsersText && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-2 right-4 text-sm text-muted-foreground p-1 px-2 rounded-full bg-background/80 backdrop-blur-sm shadow"
                        >
                            {typingUsersText}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <footer className="p-4 border-t shrink-0 bg-background/95 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-11 w-11" asChild>
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <Paperclip />
                        </label>
                    </Button>
                    <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />

                    <div className="flex-1">
                        {attachment ? (
                            <div className="flex items-center gap-2 p-2 rounded-md bg-muted text-sm h-11">
                                {uploadProgress ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4" />
                                        <span className="flex-1 truncate">{`מעלה את ${uploadProgress.fileName}...`}</span>
                                        <Progress value={uploadProgress.progress} className="w-24 h-2" />
                                    </>
                                ) : (
                                    <>
                                        <FileIcon className="h-4 w-4" />
                                        <span className="flex-1 truncate">{attachment.name}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachment(null)}><X className="h-4 w-4" /></Button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Input 
                                placeholder="כתוב הודעה..."
                                value={newMessage}
                                onChange={handleInputChange}
                                autoComplete="off"
                                className="h-11 text-base"
                            />
                        )}
                    </div>
                    
                    <Button type="submit" size="icon" className="h-11 w-11 rounded-full" disabled={(!newMessage.trim() && !attachment) || !!uploadProgress}>
                        <Send />
                    </Button>
                </form>
            </footer>
        </div>
    );
}
