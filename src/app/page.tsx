
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarCheck, Users, Briefcase, Sparkles } from "lucide-react";
import Image from "next/image";

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

const featureCards = [
    {
        icon: CalendarCheck,
        title: "תוכנית שבועית חכמה",
        description: "תכנן את השבוע שלך בקלות, הצב יעדים ונהל משימות בממשק ויזואלי ונוח.",
        color: "text-sky-500",
    },
    {
        icon: Users,
        title: "ניהול מוזמנים מתקדם",
        description: "תאם פגישות, עקוב אחר הגעה ונהל את כל המוזמנים שלך במקום אחד מרכזי.",
        color: "text-purple-500",
    },
    {
        icon: Briefcase,
        title: "הפניות ומעקב",
        description: "נהל הפניות בין גורמים שונים, עקוב אחר התקדמות וודא ששום דבר לא נופל בין הכיסאות.",
         color: "text-amber-500",
    },
    {
        icon: Sparkles,
        title: "כלי עזר מותאמים",
        description: "השתמש בכלים ייעודיים לעובדים סוציאליים המפשטים תהליכים וחוסכים זמן יקר.",
        color: "text-rose-500",
    }
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background" dir="rtl">
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto flex items-center justify-between h-20 px-4">
                <Link href="/" className="flex items-center gap-2">
                    <Logo />
                    <span className="text-2xl font-bold text-primary font-headline">עו"סנט</span>
                </Link>
                <nav className="flex items-center gap-2">
                    <Button variant="ghost" asChild>
                        <Link href="/login">כניסה</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/signup">הרשמה</Link>
                    </Button>
                </nav>
            </div>
        </header>

        <main className="flex-1">
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
                 <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent -z-10" />
                 <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -z-20" />
                <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center lg:text-right"
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-headline text-gray-800 leading-tight">
                            פלטפורמה אחת, כל הכלים. <br className="hidden lg:block" />
                            <span className="text-primary">לעובדי המנהל לשירותים חברתיים</span>
                        </h1>
                        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
                            עו"סנט היא הפלטפורמה המקיפה לניהול יום העבודה שלך. מתכנון שבועי ועד ניהול מוזמנים, הכל במקום אחד, פשוט ונגיש.
                        </p>
                        <div className="mt-8 flex justify-center lg:justify-start">
                            <Button size="lg" asChild className="group">
                                <Link href="/signup">
                                    התחילו עכשיו
                                    <ArrowLeft className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                     <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                     >
                        <Image
                            src="/home.webp"
                            width={500}
                            height={333}
                            alt="Dashboard preview"
                            className="rounded-xl shadow-2xl"
                            data-ai-hint="dashboard user interface"
                            unoptimized
                        />
                    </motion.div>
                </div>
            </section>
            
            <section className="py-20 lg:py-32 bg-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline">כל מה שצריך במקום אחד</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        הפסיקו לקפוץ בין כלים שונים. עו"סנט מרכזת עבורכם את כל הפעולות החשובות במערכת אחת אינטואיטיבית.
                    </p>
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {featureCards.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-card p-8 rounded-xl shadow-lg border border-transparent hover:border-primary hover:shadow-2xl transition-all duration-300"
                            >
                                <div className={`inline-block p-4 bg-primary/10 rounded-full ${feature.color}`}>
                                    <feature.icon className="h-8 w-8" />
                                </div>
                                <h3 className="mt-6 text-xl font-bold font-headline">{feature.title}</h3>
                                <p className="mt-2 text-muted-foreground">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </main>

        <footer className="bg-gray-800 text-white">
            <div className="container mx-auto py-8 px-4 text-center">
                <p>&copy; {new Date().getFullYear()} עו"סנט. כל הזכויות שמורות.</p>
            </div>
        </footer>
    </div>
  );
}
