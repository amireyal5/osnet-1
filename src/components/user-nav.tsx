
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { auth, db } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { doc, getDoc } from "firebase/firestore"
import { useEffect, useState } from "react"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { LogOut, User as UserIcon, Settings, AlertCircle } from "lucide-react"
import { useUserProfile } from "@/hooks/use-user-profile"
import Link from "next/link"

export function UserNav() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const { userProfile } = useUserProfile();
  
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  }

  if (!user || !userProfile) {
    return null; // Or a loading spinner
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
  }
  
  const showProfileCompletionNotice = !userProfile.isProfileComplete;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userProfile.photoURL} alt="@user" />
            <AvatarFallback>{getInitials(userProfile.firstName, userProfile.lastName)}</AvatarFallback>
          </Avatar>
           {showProfileCompletionNotice && (
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-white" />
           )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1 text-right">
            <p className="text-sm font-medium leading-none">{`${userProfile.firstName} ${userProfile.lastName}`}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userProfile.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer justify-end" asChild>
            <Link href="/profile">
                <span>פרופיל</span>
                {showProfileCompletionNotice && <AlertCircle className="ms-2 h-4 w-4 text-destructive" />}
                <UserIcon className="ms-auto h-4 w-4" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer justify-end" asChild>
             <Link href="/settings">
                <span>הגדרות</span>
                <Settings className="ms-auto h-4 w-4" />
             </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive justify-end">
          <span>התנתקות</span>
          <LogOut className="ms-auto h-4 w-4" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
