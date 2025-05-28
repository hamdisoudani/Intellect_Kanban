import './global.css';
import { ThemeProvider } from '@intellect-kanban/ui';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Intellect Kanban - Student Portal',
  description: 'Manage your learning activities and track progress',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
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
      </body>
    </html>
  );
}
