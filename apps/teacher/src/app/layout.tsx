import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@intellect-kanban/ui';
import './global.css';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  title: 'Intellect Kanban - Teacher Dashboard',
  description: 'Manage your courses and student activities',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster 
              position="top-right"
              expand={false}
              richColors
              closeButton
              toastOptions={{
                duration: 5000,
                className: "rounded-xl border border-border/50",
              }}
            />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
