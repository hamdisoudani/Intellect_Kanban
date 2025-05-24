import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@intellect-kanban/ui';
import './global.css';

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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
