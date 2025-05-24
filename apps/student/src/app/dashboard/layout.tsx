"use client";

import React, { useEffect, useState } from 'react';
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
import { getSession, logout } from '../../server/auth-actions';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);

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
            isActive: true,
          },
          {
            icon: <BoardIcon />,
            label: 'My Boards',
            href: '/dashboard/boards',
          },
          {
            icon: <ClassIcon />,
            label: 'My Classes',
            href: '/dashboard/classes',
          },
          {
            icon: <AssignmentIcon />,
            label: 'Assignments',
            href: '/dashboard/assignments',
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
          },
        ],
      },
    ],
    userProfile: user ? {
      name: user.name || 'Student',
      avatar: user.image,
    } : undefined,
  };

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