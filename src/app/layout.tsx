
import type { Metadata } from 'next';
import { Assistant } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import { AuthUserProvider } from '@/hooks/use-user-profile';

const fontBody = Assistant({
  subsets: ['latin', 'hebrew'],
  weight: ['400', '500', '700'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'עו"סנט',
  description: 'עובדי המנהל לשרותים חברתיים בכרמיאל',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased text-base text-[#333333]',
          fontBody.variable
        )}
      >
        <AuthUserProvider>
          {children}
        </AuthUserProvider>
        <Toaster />
      </body>
    </html>
  );
}
