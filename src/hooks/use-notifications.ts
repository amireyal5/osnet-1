
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  serverTimestamp,
  startAfter,
  getDocs,
  Timestamp,
  getDoc,
  arrayUnion,
  arrayRemove,
  updateDoc,
  FieldValue,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useToast } from './use-toast';
import * as firestoreService from '@/services/firestoreService';
import { UserProfile } from './use-user-profile';

export type { UserProfile };


export interface Thread {
    id: string;
    participantIds: string[];
    participants: Record<string, UserProfile>;
    title?: string;
    lastMessageContent: string;
    lastMessageTimestamp: Timestamp;
    lastMessageSenderId: string;
    unreadCounts: Record<string, number>;
    hiddenBy?: string[];
    typingUsers?: string[];
}

export interface Message {
    id: string;
    senderId: string;
    content: string;
    contentType: 'text' | 'image' | 'file';
    fileURL?: string;
    fileName?: string;
    timestamp: Timestamp;
    status?: 'sent' | 'delivered' | 'read' | 'deleted';
    edited?: boolean;
}

const MESSAGES_PER_PAGE = 30;

export function useNotifications() {
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState({ threads: true, messages: false });
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const lastMessageDocRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch threads
  useEffect(() => {
    if (!user) {
        setIsLoading(prev => ({ ...prev, threads: false }));
        return;
    }

    const threadsQuery = query(
      collection(db, 'threads'),
      where('participantIds', 'array-contains', user.uid),
      // where('hiddenBy', 'not-in', [[user.uid]]), // This causes an error if the field doesn't exist.
      orderBy('lastMessageTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(threadsQuery, (snapshot) => {
      const threadsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Thread))
        .filter(thread => !thread.hiddenBy || !thread.hiddenBy.includes(user.uid));
      setThreads(threadsData);
      setIsLoading(prev => ({ ...prev, threads: false }));
    }, (error) => {
        console.error("Error fetching threads:", error);
        toast({ title: "שגיאה בטעינת שיחות", description: "לא ניתן היה לטעון את רשימת השיחות. ייתכן שחסר אינדקס ב-Firestore.", variant: "destructive" });
        setIsLoading(prev => ({ ...prev, threads: false }));
    });

    return () => unsubscribe();
  }, [user, toast]);
  
  // Clear typing status on unmount or when user changes
   useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (user?.uid && selectedThread?.id) {
         firestoreService.updateTypingStatus(selectedThread.id, user.uid, false);
      }
    };
  }, [user, selectedThread?.id]);


  // Fetch messages for selected thread
  useEffect(() => {
    if (!selectedThread) {
        setMessages([]);
        return;
    };

    setIsLoading(prev => ({ ...prev, messages: true }));
    lastMessageDocRef.current = null;
    setHasMoreMessages(true);

    const messagesQuery = query(
      collection(db, 'threads', selectedThread.id, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(MESSAGES_PER_PAGE)
    );
    
    // Subscribe to thread document for real-time typing updates
    const threadDocRef = doc(db, 'threads', selectedThread.id);
    const unsubThread = onSnapshot(threadDocRef, (doc) => {
        if(doc.exists()) {
            const updatedThread = { id: doc.id, ...doc.data() } as Thread;
            setSelectedThread(updatedThread);
        }
    });
    
    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)).reverse();
      setMessages(messagesData);
      lastMessageDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      setHasMoreMessages(snapshot.docs.length === MESSAGES_PER_PAGE);
      setIsLoading(prev => ({ ...prev, messages: false }));

      // Reset unread count
      if(user && selectedThread.unreadCounts[user.uid] > 0) {
        firestoreService.resetUnreadCount(selectedThread.id, user.uid);
      }

    });

    return () => {
        unsubMessages();
        unsubThread();
    };
  }, [selectedThread?.id, user]);

  const loadMoreMessages = useCallback(async () => {
    if (!selectedThread || !hasMoreMessages || isLoading.messages) return;

    setIsLoading(prev => ({ ...prev, messages: true }));
    
    const messagesQuery = query(
      collection(db, 'threads', selectedThread.id, 'messages'),
      orderBy('timestamp', 'desc'),
      startAfter(lastMessageDocRef.current),
      limit(MESSAGES_PER_PAGE)
    );

    const snapshot = await getDocs(messagesQuery);
    const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)).reverse();
    setMessages(prev => [...newMessages, ...prev]);
    lastMessageDocRef.current = snapshot.docs[snapshot.docs.length - 1];
    setHasMoreMessages(snapshot.docs.length === MESSAGES_PER_PAGE);
    setIsLoading(prev => ({ ...prev, messages: false }));

  }, [selectedThread, hasMoreMessages, isLoading.messages]);

  const handleSendMessage = useCallback(async (content: string, contentType: Message['contentType'] = 'text', fileURL?: string, fileName?: string) => {
    if (!user || !selectedThread) return;

    try {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
        await firestoreService.updateTypingStatus(selectedThread.id, user.uid, false);
        
        const messageData = {
            senderId: user.uid,
            content,
            contentType,
            fileURL: fileURL || null,
            fileName: fileName || null,
            timestamp: serverTimestamp(),
            status: 'sent'
        };

        const unreadCountsUpdate: Record<string, any> = {};
        selectedThread.participantIds.forEach(id => {
            if (id !== user.uid) {
                unreadCountsUpdate[`unreadCounts.${id}`] = (selectedThread.unreadCounts[id] || 0) + 1;
            }
        });

        const threadUpdateData = {
            lastMessageContent: contentType === 'text' ? content : fileName || 'קובץ',
            lastMessageTimestamp: serverTimestamp(),
            lastMessageSenderId: user.uid,
            ...unreadCountsUpdate,
        }

        await firestoreService.sendMessage(selectedThread.id, messageData, threadUpdateData);

    } catch (error) {
        console.error("Error sending message:", error);
        toast({ title: "שגיאה בשליחת הודעה", variant: "destructive" });
    }
  }, [user, selectedThread, toast]);
  
  const handleCreateThread = useCallback(async (recipients: UserProfile[], initialMessage: string, title?: string) => {
    if (!user) {
      toast({title: "שגיאה", description: "עליך להיות מחובר", variant: "destructive"});
      return false;
    };
    
    const currentUserProfileDoc = await getDoc(doc(db, 'users', user.uid));
    if (!currentUserProfileDoc.exists()) {
        toast({title: "שגיאה", description: "לא נמצא פרופיל משתמש.", variant: "destructive"});
        return false;
    }
    const currentUserProfile = { id: user.uid, ...currentUserProfileDoc.data() } as UserProfile;

    // Use a Set to ensure all participants are unique, then convert back to an array
    const allParticipants = [...recipients, currentUserProfile];
    const uniqueParticipantIds = [...new Set(allParticipants.map(p => p.id))];
    
    const participantsMap = uniqueParticipantIds.reduce((acc, id) => {
        const participantProfile = allParticipants.find(p => p.id === id);
        if (participantProfile) {
            acc[id] = participantProfile;
        }
        return acc;
    }, {} as Record<string, UserProfile>);

    const sortedParticipantIds = [...uniqueParticipantIds].sort();

    const unreadCounts: Record<string, number> = {};
    sortedParticipantIds.forEach(id => {
        unreadCounts[id] = (id !== user.uid) ? 1 : 0;
    });

    try {
      const threadData: Omit<Thread, 'id' | 'lastMessageTimestamp'> & { createdAt: FieldValue, lastMessageTimestamp: FieldValue } = {
          participantIds: sortedParticipantIds,
          participants: participantsMap,
          // @ts-ignore
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          lastMessageContent: initialMessage,
          lastMessageTimestamp: serverTimestamp(),
          lastMessageSenderId: user.uid,
          unreadCounts,
          hiddenBy: [],
          typingUsers: [],
      };

      if (title) {
          threadData.title = title;
      }

      const firstMessage = {
          senderId: user.uid,
          content: initialMessage,
          contentType: 'text' as const,
          timestamp: serverTimestamp(),
      };

      const threadRef = await firestoreService.createThread(threadData, firstMessage);
      
      const newThreadDocData = await getDoc(threadRef);
      const newThreadDoc = { id: newThreadDocData.id, ...newThreadDocData.data() } as Thread;
      setSelectedThread(newThreadDoc);

      toast({ title: "השיחה נוצרה בהצלחה" });
      return true;
    } catch (error) {
      console.error("Error creating thread:", error);
      toast({ title: "שגיאה ביצירת שיחה", description: "אירעה שגיאה. בדוק את כללי האבטחה ונסה שוב.", variant: "destructive" });
      return false;
    }
}, [user, toast]);


  const handleDeleteMessage = useCallback(async (threadId: string, messageId: string) => {
      if (!user) return;

      try {
          await firestoreService.deleteMessage(threadId, messageId);
          toast({title: "ההודעה נמחקה"});
      } catch(error) {
          console.error("Error deleting message: ", error);
          toast({title: "שגיאה במחיקת הודעה", variant: "destructive"});
      }
  }, [user, toast]);

  const handleHideThread = useCallback(async (threadId: string) => {
    if (!user) return;
    try {
      await firestoreService.hideThreadForUser(threadId, user.uid);
      if (selectedThread?.id === threadId) {
        setSelectedThread(null);
      }
      toast({title: "השיחה הועברה לארכיון"});
    } catch (error) {
      console.error("Error hiding thread:", error);
      toast({title: "שגיאה בהסתרת השיחה", variant: "destructive"});
    }
  }, [user, toast, selectedThread]);
  
   const handleTyping = useCallback((threadId: string) => {
        if (!user) return;

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set user as typing
        firestoreService.updateTypingStatus(threadId, user.uid, true);

        // Set a timeout to clear typing status
        typingTimeoutRef.current = setTimeout(() => {
            firestoreService.updateTypingStatus(threadId, user.uid, false);
            typingTimeoutRef.current = null;
        }, 5000); // 5 seconds
    }, [user]);



  return { 
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
  };
}
