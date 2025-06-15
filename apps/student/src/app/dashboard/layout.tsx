"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SessionProvider, useSession } from 'next-auth/react';
import {
  DashboardLayout,
  Header,
  LogoIcon,
  DashboardIcon,
  BoardIcon,
  ClassIcon,
  AssignmentIcon,
  SettingsIcon,
} from '@intellect-kanban/ui';
import { logout } from '../../server/auth-actions';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const user = session?.user;
  const pathname = usePathname();
  const isBoardRoute = pathname.includes('/dashboard/board/');

  // Handle sign out
  const handleSignOut = async () => {
    await logout();
  };

  // Student-specific sidebar configuration
  const sidebarConfig = {
    logo: <LogoIcon />,
    appName: 'Intellect Kanban',
    appDescription: 'Student Dashboard',
    sections: [
      {
        title: 'MAIN MENU',
        items: [
          {
            icon: <DashboardIcon />,
            label: 'Dashboard',
            href: '/dashboard',
            isActive: pathname === '/dashboard',
          },
          {
            icon: <BoardIcon />,
            label: 'My Boards',
            href: '/dashboard/boards',
            isActive: pathname.includes('/dashboard/boards'),
          },
          {
            icon: <ClassIcon />,
            label: 'My Classes',
            href: '/dashboard/classes',
            isActive: pathname.includes('/dashboard/classes'),
          },
          {
            icon: <AssignmentIcon />,
            label: 'Assignments',
            href: '/dashboard/assignments',
            isActive: pathname.includes('/dashboard/assignments'),
          },
        ],
      },
      {
        title: 'ACCOUNT',
        items: [
          {
            icon: <SettingsIcon />,
            label: 'Settings',
            href: '/dashboard/settings',
            isActive: pathname.includes('/dashboard/settings'),
          },
        ],
      },
    ],
    userProfile: user ? {
      name: user.name || 'Student',
      avatar: user.image ?? undefined,
    } : undefined,
  };

  if (isBoardRoute) {
    return (
      <div className="w-full min-h-screen bg-background">
        <div className="flex flex-col min-h-screen">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      sidebar={sidebarConfig}
      user={user}
      onSignOut={handleSignOut}
    >
      {children}
    </DashboardLayout>
  );
}

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  );
} 