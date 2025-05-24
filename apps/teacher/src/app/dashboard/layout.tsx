"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  DashboardLayout,
  Header,
  LogoIcon,
  DashboardIcon,
  BoardIcon,
  ClassIcon,
  AssignmentIcon,
  StudentsIcon,
  SettingsIcon,
} from '@intellect-kanban/ui';
import { getSession, logout } from '../../server/auth-actions';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const isBoardRoute = pathname.includes('/dashboard/board/');

  // Fetch session on component mount
  useEffect(() => {
    const fetchSession = async () => {
      const session = await getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };

    fetchSession();
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    await logout();
  };

  // Teacher-specific sidebar configuration
  const sidebarConfig = {
    logo: <LogoIcon />,
    appName: 'Intellect Kanban',
    appDescription: 'Teacher Dashboard',
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
            label: 'Kanban Boards',
            href: '/dashboard/boards',
            isActive: pathname.includes('/dashboard/boards'),
          },
          {
            icon: <ClassIcon />,
            label: 'Classes',
            href: '/dashboard/classes',
            isActive: pathname.includes('/dashboard/classes'),
          },
          {
            icon: <AssignmentIcon />,
            label: 'Assignments',
            href: '/dashboard/assignments',
            isActive: pathname.includes('/dashboard/assignments'),
          },
          {
            icon: <StudentsIcon />,
            label: 'Students',
            href: '/dashboard/students',
            isActive: pathname.includes('/dashboard/students'),
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
      name: user.name || 'Teacher',
      avatar: user.image,
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