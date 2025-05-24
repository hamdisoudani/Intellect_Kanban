"use client";

import React from 'react';
import { cn } from '@intellect-kanban/utils';
import { Button } from '../ui/button';
import { ThemeToggle } from '../theme/theme-toggle';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export interface HeaderProps {
  children?: React.ReactNode;
  showThemeToggle?: boolean;
  className?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  onSignOut?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export interface HeaderActionsProps {
  children: React.ReactNode;
  className?: string;
}

export interface ProfileMenuProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  onSignOut?: () => void;
}

export function ProfileMenu({ user, onSignOut }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const toggleDropdown = () => setIsOpen(!isOpen);
  
  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    }
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <Button
        onClick={toggleDropdown}
        variant="ghost"
        className="p-0 h-8 w-8 rounded-full"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
          {user?.image ? (
            <img src={user.image} alt={user.name || "User"} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span>{user?.name?.charAt(0) || "U"}</span>
          )}
        </div>
      </Button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute right-0 mt-2 w-48 py-2 bg-background border border-border rounded-md shadow-md z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <div className="px-4 py-2 border-b border-border">
              <p className="font-medium">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
            </div>
            <div className="py-1">
              <Link 
                href="/dashboard/profile" 
                className="block px-4 py-2 text-sm hover:bg-secondary"
              >
                Profile Settings
              </Link>
              <Button 
                onClick={handleSignOut}
                variant="ghost"
                className="w-full justify-start px-4 py-2 text-sm text-destructive hover:bg-secondary hover:text-destructive"
              >
                Sign Out
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header({ 
  children, 
  showThemeToggle = true, 
  className, 
  user, 
  onSignOut,
  isSidebarCollapsed,
  onToggleSidebar
}: HeaderProps) {
  return (
    <header className={cn("border-b border-border h-14 flex items-center gap-4 px-4", className)}>
      {onToggleSidebar && (
        <Button
          onClick={onToggleSidebar}
          variant="ghost"
          size="icon"
          className="mr-2 text-muted-foreground hover:text-foreground"
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isSidebarCollapsed ? (
              <motion.div
                key="expand"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 3v18" />
                  <path d="m14 9 3 3-3 3" />
                </svg>
              </motion.div>
            ) : (
              <motion.div
                key="collapse"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                transition={{ duration: 0.2 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 3v18" />
                  <path d="m16 15-3-3 3-3" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      )}
      {children}
      <div className="ml-auto flex items-center gap-3">
        {showThemeToggle && <ThemeToggle />}
        {user && <ProfileMenu user={user} onSignOut={onSignOut} />}
      </div>
    </header>
  );
}

export function HeaderActions({ children, className }: HeaderActionsProps) {
  return (
    <div className={cn("flex items-center gap-2 ml-auto", className)}>
      {children}
    </div>
  );
} 
