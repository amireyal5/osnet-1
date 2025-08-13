
"use client";

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { auth, db } from "@/lib/firebase"
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { Loader2 } from "lucide-react";
import { createProviderUserProfileDocument, userProfileExists } from "@/services/firestoreService";
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";

function Logo() {
  return (
    <svg 
        className="h-8 w-auto text-primary" 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4Z" fill="currentColor" />
        <path d="M31 18C31 21.866 27.866 25 24 25C20.134 25 17 21.866 17 18C17 14.134 20.134 11 24 11C27.866 11 31 14.134 31 18Z" fill="white" />
        <path d="M14 34C14 29.5817 17.5817 26 22 26H26C30.4183 26 34 29.5817 34 34V37H14V34Z" fill="white" />
    </svg>
  );
}

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.011,35.616,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
)

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleSuccessfulLogin = async (user: any) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists() || !userDocSnap.data()?.isProfileComplete) {
      router.push('/complete-profile');
      return;
    }
    
    if (userDocSnap.data()?.status !== 'פעיל') {
       toast({
        variant: "destructive",
        title: "חשבון לא פעיל",
        description: "חשבונך ממתין לאישור מנהל או שאינו פעיל.",
        duration: 10000,
      });
      await signOut(auth);
      return;
    }

    router.push('/dashboard');
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleSuccessfulLogin(userCredential.user);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "שגיאת התחברות",
        description: "האימייל או הסיסמה שהזנת אינם נכונים.",
      })
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const exists = await userProfileExists(user.uid);

        if (!exists) {
            await createProviderUserProfileDocument(user);
        }
        
        await handleSuccessfulLogin(user);

    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "שגיאת התחברות עם גוגל",
            description: "אירעה שגיאה. נסה שוב."
        });
    } finally {
        setIsGoogleLoading(false);
    }
  }

  return (
    <>
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <Card className="mx-auto max-w-sm w-full shadow-lg border">
            <CardHeader className="text-center">
                <Link href="/" className="flex justify-center items-center mb-4">
                    <Logo />
                </Link>
            <CardTitle className="text-2xl font-headline">כניסה למערכת</CardTitle>
            <CardDescription>
                שמחים לראות אותך שוב!
            </CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleLogin} className="grid gap-4">
                <div className="grid gap-2 text-right">
                <Label htmlFor="email">כתובת אימייל</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || isGoogleLoading}
                />
                </div>
                <div className="grid gap-2 text-right">
                <div className="flex">
                    <Label htmlFor="password">סיסמה</Label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="me-auto inline-block text-sm text-primary hover:underline"
                    >
                      שכחת סיסמה?
                    </button>
                </div>
                <Input
                    id="password"
                    type="password"
                    required
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || isGoogleLoading}
                />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading && <Loader2 className="animate-spin me-2" />}
                כניסה
                </Button>
            </form>
            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                    או המשך עם
                    </span>
                </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading}>
                {isGoogleLoading ? <Loader2 className="animate-spin me-2" /> : <GoogleIcon className="me-2 h-4 w-4" />}
                התחברות עם גוגל
                </Button>
            <div className="mt-4 text-center text-sm">
                אין לך חשבון?{" "}
                <Link href="/signup" className="text-primary hover:underline font-semibold">
                הרשמה
                </Link>
            </div>
            </CardContent>
        </Card>
    </div>
    <ForgotPasswordDialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen} />
    </>
  )
}

    