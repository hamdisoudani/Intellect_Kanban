"use client";

import React from 'react';
import { cn } from '@intellect-kanban/utils';
import { Button } from '../ui/button';
import { ThemeToggle } from '../theme/theme-toggle';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PanelLeftIcon, 
  PanelRightIcon, 
  Menu, 
  X,
  User,
  LogOut,
  Settings
} from 'lucide-react';

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
  isMobile?: boolean;
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
        className="p-0 h-8 w-8 rounded-full overflow-hidden border border-border hover:border-primary/50 transition-colors"
      >
        <div className="flex items-center justify-center w-full h-full rounded-full bg-primary/10 text-primary">
          {user?.image ? (
            <img src={user.image} alt={user.name || "User"} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-sm font-medium">{user?.name?.charAt(0) || "U"}</span>
          )}
        </div>
      </Button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Invisible overlay to capture clicks outside the dropdown */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div 
              className="absolute right-0 mt-2 w-56 py-2 bg-card border border-border rounded-md shadow-lg z-50"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="px-4 py-2 border-b border-border">
                <p className="font-medium truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
              </div>
              <div className="py-1">
                <Link 
                  href="/dashboard/settings" 
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
                <Link 
                  href="/dashboard/profile" 
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <User size={16} />
                  <span>Profile</span>
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
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
  isMobile,
  onToggleSidebar
}: HeaderProps) {
  return (
    <header className={cn(
      "border-b border-border h-14 flex items-center gap-4 px-4 bg-background/95 backdrop-blur-sm",
      className
    )}>
      {onToggleSidebar && (
        <Button
          onClick={onToggleSidebar}
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={isMobile ? "Open menu" : (isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar")}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isMobile ? (
              <motion.div
                key="menu"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Menu size={20} />
              </motion.div>
            ) : isSidebarCollapsed ? (
              <motion.div
                key="expand"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <PanelRightIcon size={20} />
              </motion.div>
            ) : (
              <motion.div
                key="collapse"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <PanelLeftIcon size={20} />
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
