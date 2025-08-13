
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from './use-user-profile';
import { useToast } from './use-toast';

export function useAuthCheck() {
  const { userProfile, isLoading } = useUserProfile();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading) {
      if (!userProfile) {
        // Not logged in at all, or profile doesn't exist
        router.push('/');
      } else if (userProfile.status !== 'פעיל') {
        // Logged in, but not approved yet
        toast({
          title: "ממתין לאישור",
          description: "חשבונך עדיין ממתין לאישור מנהל המערכת.",
          variant: "destructive"
        });
        router.push('/');
      }
    }
  }, [userProfile, isLoading, router, toast]);

  return { user: userProfile, isLoading };
}
