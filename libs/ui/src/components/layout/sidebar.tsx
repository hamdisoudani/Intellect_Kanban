"use client";

import React from 'react';
import { cn } from '@intellect-kanban/utils';
import Link from 'next/link';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip';

export interface SidebarMenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
  count?: number;
}

export interface SidebarSection {
  title?: string; 
  items: SidebarMenuItem[];
}

export interface UserProfile {
  name: string;
  avatar?: string;
}

export interface SidebarProps {
  logo: React.ReactNode;
  appName: string;
  appDescription?: string;
  sections: SidebarSection[];
  userProfile?: UserProfile;
  className?: string;
  isCollapsed?: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

// Animation variants
const sidebarVariants = {
  expanded: {
    width: 256, // w-64 is 256px
    transition: {
      type: "spring", 
      stiffness: 400, 
      damping: 30,
      duration: 0.3
    }
  },
  collapsed: {
    width: 56, // w-14 is 56px
    transition: {
      type: "spring", 
      stiffness: 400, 
      damping: 30,
      duration: 0.3
    }
  },
  mobile: {
    x: 0,
    transition: {
      type: "spring", 
      stiffness: 400, 
      damping: 30,
      duration: 0.3
    }
  },
  mobileHidden: {
    x: "-100%",
    transition: {
      type: "spring", 
      stiffness: 400, 
      damping: 30,
      duration: 0.3
    }
  }
};

export function Sidebar({
  logo,
  appName,
  appDescription,
  sections,
  userProfile,
  className,
  isCollapsed = false,
  isMobile = false,
  onClose,
}: SidebarProps) {
  const sidebarVariant = isMobile 
    ? "mobile"
    : isCollapsed 
      ? "collapsed" 
      : "expanded";

  return (
    <motion.aside 
      className={cn(
        "flex flex-col h-full border-r border-border bg-background/95 backdrop-blur-sm text-foreground",
        isMobile && "fixed inset-y-0 left-0 w-64 shadow-xl",
        className
      )}
      variants={sidebarVariants}
      initial={isMobile ? "mobileHidden" : false}
      animate={sidebarVariant}
    >
      {/* App logo and name */}
      <div className="flex items-center gap-3 h-14 px-4 border-b border-border overflow-hidden">
        {isMobile && onClose && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="absolute right-2 top-2 md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
        <div className="flex-shrink-0 w-8 h-8">{logo}</div>
        <AnimatePresence>
          {(!isCollapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              <h1 className="font-semibold tracking-tight">{appName}</h1>
              {appDescription && (
                <p className="text-xs text-muted-foreground leading-tight">{appDescription}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation sections */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <AnimatePresence>
              {section.title && (!isCollapsed || isMobile) && (
                <motion.h2
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="uppercase text-xs tracking-wider text-muted-foreground font-semibold px-4 pt-4 pb-2"
                >
                  {section.title}
                </motion.h2>
              )}
            </AnimatePresence>
            <ul className="space-y-1">
              {section.items.map((item, itemIndex) => (
                <motion.li 
                  key={itemIndex}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.2,
                    delay: itemIndex * 0.05 // Stagger effect
                  }}
                >
                  {isCollapsed && !isMobile ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            aria-label={item.label}
                            className={cn(
                              'relative flex items-center justify-center h-10 w-10 rounded-md transition-colors',
                              item.isActive && 'bg-primary/10',
                              'hover:bg-muted/20 focus:bg-muted/20',
                              'mx-auto'
                            )}
                            tabIndex={0}
                          >
                            {/* Active indicator */}
                            {item.isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r" />
                            )}
                            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                              {item.icon}
                            </span>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Link
                      href={item.href}
                      aria-label={item.label}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                        item.isActive 
                          ? 'bg-primary/10 text-primary font-medium border-l-4 border-primary' 
                          : 'hover:bg-secondary text-foreground hover:text-foreground',
                        (!isCollapsed || isMobile) ? 'justify-start' : 'justify-center'
                      )}
                    >
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        {item.icon}
                      </span>
                      <AnimatePresence>
                        {(!isCollapsed || isMobile) && (
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center justify-between w-full"
                          >
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.count !== undefined && (
                              <span className={cn(
                                'text-xs font-medium ml-1 px-2 py-0.5 rounded-full',
                                item.isActive 
                                  ? 'bg-primary/20 text-primary' 
                                  : 'bg-muted text-muted-foreground'
                              )}>
                                {item.count}
                              </span>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Link>
                  )}
                </motion.li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* User profile */}
      {userProfile && (
        <div className="!hidden flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground border-t border-border mt-auto">
          <div className="relative flex-shrink-0">
            {userProfile.avatar ? (
              <img 
                src={userProfile.avatar} 
                alt={userProfile.name} 
                className="w-8 h-8 rounded-full border border-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-border">
                {userProfile.name.charAt(0)}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.div 
                className="flex flex-col"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-sm font-medium truncate">{userProfile.name}</span>
                <span className="text-xs text-muted-foreground">Online</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.aside>
  );
} 