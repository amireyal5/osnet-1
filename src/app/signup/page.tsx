
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/lib/firebase"
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"
import { createUserProfileDocument, createProviderUserProfileDocument, userProfileExists } from "@/services/firestoreService"
import { Loader2, Eye, EyeOff } from "lucide-react"

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

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        toast({
            variant: "destructive",
            title: "שגיאת הרשמה",
            description: "הסיסמה חייבת להכיל לפחות 6 תווים.",
        });
        return;
    }
    if (password !== confirmPassword) {
        toast({
            variant: "destructive",
            title: "שגיאת הרשמה",
            description: "הסיסמאות אינן תואמות.",
        });
        return;
    }
     if (!firstName || !lastName) {
        toast({ variant: "destructive", title: "שדות חסרים", description: "אנא מלא שם פרטי ושם משפחה." })
        return
    }
    setIsLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await createUserProfileDocument(user, firstName, lastName);
      
        toast({ 
            title: "שלב 1 הושלם בהצלחה!", 
            description: "כעת, אנא השלם את יתר הפרטים שלך.",
        });
        
        // Don't sign out, proceed to complete profile
        router.push('/complete-profile');

    } catch (error: any) {
      let description = "אירעה שגיאה. אנא נסה שוב."
      if (error.code === 'auth/email-already-in-use') {
        description = "האימייל הזה כבר נמצא בשימוש."
      }
       toast({
        variant: "destructive",
        title: "שגיאת הרשמה",
        description: description,
      })
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const exists = await userProfileExists(user.uid);
        if (!exists) {
            await createProviderUserProfileDocument(user);
            toast({ title: "שלב 1 הושלם", description: "אנא השלם את יתר הפרטים שלך." });
        }
        
        // Whether new or existing, go to complete-profile to ensure all fields are filled.
        router.push('/complete-profile');

    } catch (error: any) {
        let description = "אירעה שגיאה עם ההתחברות של גוגל."
        if (error.code === 'auth/account-exists-with-different-credential') {
            description = "כבר קיים חשבון עם אימייל זה."
        }
        toast({
            variant: "destructive",
            title: "שגיאת הרשמה",
            description: description,
        });
        // Sign out on error to avoid being in a weird state
        await signOut(auth);
    } finally {
        setIsGoogleLoading(false);
    }
  }


  return (
     <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <Card className="mx-auto max-w-sm w-full shadow-lg border">
            <CardHeader className="text-center">
                <Link href="/" className="flex justify-center items-center mb-4">
                    <Logo />
                </Link>
            <CardTitle className="text-2xl font-headline">יצירת חשבון חדש (שלב 1 מתוך 2)</CardTitle>
            <CardDescription>
                הזן את פרטיך כדי להצטרף למערכת
            </CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSignup} className="grid gap-4 text-right">
                <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="first-name">שם פרטי</Label>
                    <Input id="first-name" placeholder="ישראל" required value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isLoading || isGoogleLoading} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="last-name">שם משפחה</Label>
                    <Input id="last-name" placeholder="ישראלי" required value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isLoading || isGoogleLoading} />
                </div>
                </div>
                <div className="grid gap-2">
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
                <div className="grid gap-2 relative">
                    <Label htmlFor="password">סיסמה</Label>
                    <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        dir="ltr" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        disabled={isLoading || isGoogleLoading} 
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-1 left-1 h-7 w-7 text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                </div>
                 <div className="grid gap-2 relative">
                    <Label htmlFor="confirm-password">אימות סיסמה</Label>
                    <Input 
                        id="confirm-password" 
                        type={showPassword ? "text" : "password"} 
                        dir="ltr" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        disabled={isLoading || isGoogleLoading}
                    />
                     <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-1 left-1 h-7 w-7 text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading && <Loader2 className="animate-spin me-2" />}
                המשך לשלב הבא
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
             <Button variant="outline" className="w-full mt-2" disabled={isLoading || isGoogleLoading} onClick={handleGoogleSignup}>
                {isGoogleLoading ? <Loader2 className="animate-spin me-2" /> : <GoogleIcon className="me-2 h-4 w-4" />}
                הירשם עם גוגל
                </Button>
            <div className="mt-4 text-center text-sm">
                יש לך כבר חשבון?{" "}
                <Link href="/login" className="text-primary hover:underline font-semibold">
                התחבר
                </Link>
            </div>
            </CardContent>
        </Card>
    </div>
  )
}

    