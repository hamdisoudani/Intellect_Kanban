"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@intellect-kanban/utils';
import { Sidebar, SidebarProps } from './sidebar';
import { Header } from './header';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@intellect-kanban/utils';

// Define animation variants for main content
const contentVariants = {
  expanded: {
    marginLeft: 0,
    width: "calc(100% - var(--sidebar-width))"
  },
  collapsed: {
    marginLeft: 0,
    width: "calc(100% - var(--sidebar-collapsed-width))"
  },
  mobile: {
    marginLeft: 0,
    width: "100%"
  }
};

export interface DashboardLayoutProps {
  sidebar: SidebarProps;
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean; // For full-width content areas like boards
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
  fullWidth = false,
  user,
  onSignOut
}: DashboardLayoutProps) {
  // Get saved sidebar state from localStorage if available
  const [initialized, setInitialized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  // Check if we're on mobile
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Initialize sidebar state from localStorage on mount
  useEffect(() => {
    // Only run on the client side
    if (typeof window === 'undefined') return;
    /*
    **
    ** There is still a linter issue with window references, 
    ** but this is expected in a Next.js application as TypeScript doesn't recognize browser globals in server components. 
    ** Since we've added the "use client" directive, these will work correctly at runtime.
    **
    */
    try {
      const savedState = window.localStorage.getItem('sidebar-collapsed');
      if (savedState) {
        setSidebarCollapsed(savedState === 'true');
      }
    } catch (error) {
      // Handle localStorage errors (e.g., privacy mode)
      console.error('Failed to access localStorage:', error);
    }
    
    // On mobile, default to collapsed
    if (isMobile) {
      setSidebarCollapsed(true);
      setSidebarVisible(false);
    }
    
    setInitialized(true);
  }, [isMobile]);
  
  // Update localStorage when sidebar state changes
  useEffect(() => {
    // Only run on the client side
    if (typeof window === 'undefined' || !initialized) return;
    
    try {
      window.localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed));
    } catch (error) {
      // Handle localStorage errors
      console.error('Failed to save to localStorage:', error);
    }
  }, [sidebarCollapsed, initialized]);
  
  // Handle sidebar visibility on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarVisible(false);
    } else {
      setSidebarVisible(true);
    }
  }, [isMobile]);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setSidebarVisible(!sidebarVisible);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  };

  // Create a custom header with sidebar toggle functionality
  const defaultHeader = user ? (
    <Header 
      user={user} 
      onSignOut={onSignOut}
      isSidebarCollapsed={sidebarCollapsed}
      isMobile={isMobile}
      onToggleSidebar={handleToggleSidebar}
    />
  ) : (
    <Header 
      isSidebarCollapsed={sidebarCollapsed}
      isMobile={isMobile}
      onToggleSidebar={handleToggleSidebar}
    />
  );

  // Determine which animation variant to use
  const contentVariant = isMobile 
    ? "mobile" 
    : (sidebarCollapsed ? "collapsed" : "expanded");
    
  // For full-width layouts like boards, override some styles
  const mainContentClass = cn(
    "relative flex-1 overflow-auto transition-all duration-300",
    fullWidth ? "p-0" : "p-4 md:p-6",
    className
  );

  return (
    <div 
      className="flex h-screen w-full overflow-hidden bg-background"
      style={{
        '--sidebar-width': '240px',
        '--sidebar-collapsed-width': '72px',
      } as React.CSSProperties}
    >
      <AnimatePresence>
        {sidebarVisible && (
          <Sidebar 
            {...sidebar} 
            isCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            onClose={() => isMobile && setSidebarVisible(false)}
            className="h-screen z-30" 
          />
        )}
      </AnimatePresence>
      
      {/* Overlay for mobile sidebar */}
      {isMobile && sidebarVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarVisible(false)}
        />
      )}
      
      <motion.div 
        className="flex flex-col flex-1 overflow-hidden z-10"
        variants={contentVariants}
        initial={false}
        animate={contentVariant}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 30,
          duration: 0.3 
        }}
      >
        <div className="sticky top-0 z-20">
          {header || defaultHeader}
        </div>
        
        <main className={mainContentClass}>
          {children}
        </main>
      </motion.div>
    </div>
  );
} 