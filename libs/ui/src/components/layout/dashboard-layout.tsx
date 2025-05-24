"use client";

import React, { useState } from 'react';
import { cn } from '@intellect-kanban/utils';
import { Sidebar, SidebarProps } from './sidebar';
import { Header } from './header';
import { motion } from 'framer-motion';

export interface DashboardLayoutProps {
  sidebar: SidebarProps;
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  onSignOut?: () => void;
}

export function DashboardLayout({ 
  sidebar, 
  header,
  children, 
  className,
  user,
  onSignOut
}: DashboardLayoutProps) {
  // Manage sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  // Create a custom header with sidebar toggle functionality
  const defaultHeader = user ? (
    <Header 
      user={user} 
      onSignOut={onSignOut}
      isSidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={handleToggleSidebar}
    />
  ) : (
    <Header 
      isSidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={handleToggleSidebar}
    />
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar 
        {...sidebar} 
        isCollapsed={sidebarCollapsed}
        className="h-screen" // Ensure sidebar takes full height
      />
      <motion.div 
        className="flex flex-col flex-1 overflow-hidden"
        animate={{ 
          marginLeft: 0 
        }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 30,
          duration: 0.2 
        }}
      >
        {header || defaultHeader}
        <main className={cn("flex-1 overflow-auto p-6", className)}>
          {children}
        </main>
      </motion.div>
    </div>
  );
} 