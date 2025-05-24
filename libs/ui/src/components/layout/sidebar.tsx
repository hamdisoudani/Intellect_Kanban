"use client";

import React from 'react';
import { cn } from '@intellect-kanban/utils';
import Link from 'next/link';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';

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
}

export function Sidebar({
  logo,
  appName,
  appDescription,
  sections,
  userProfile,
  className,
  isCollapsed = false,
}: SidebarProps) {
  return (
    <motion.aside 
      className={cn(
        "flex flex-col h-full border-r border-border bg-sidebar text-sidebar-foreground",
        className
      )}
      animate={{
        width: isCollapsed ? 64 : 256, // w-16 is 64px, w-64 is 256px
      }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        duration: 0.2 
      }}
    >
      {/* App logo and name */}
      <div className="flex items-center gap-3 h-14 px-4 border-b border-border overflow-hidden">
        <div className="flex-shrink-0 w-8 h-8">{logo}</div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="font-medium">{appName}</h1>
              {appDescription && <p className="text-xs text-sidebar-foreground/60">{appDescription}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation sections */}
      <div className="flex-1 overflow-y-auto py-2">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="px-2 py-2">
            <AnimatePresence>
              {section.title && !isCollapsed && (
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-3 mb-1 text-xs font-medium uppercase text-sidebar-foreground/50"
                >
                  {section.title}
                </motion.h2>
              )}
            </AnimatePresence>
            <ul className="space-y-1">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      item.isActive 
                        ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                        : "hover:bg-sidebar-accent/50 text-sidebar-foreground",
                      isCollapsed && "justify-center"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center"
                        >
                          <span className="flex-1">{item.label}</span>
                          {item.count !== undefined && (
                            <span className="text-xs bg-sidebar-accent/30 px-2 py-0.5 rounded-full">
                              {item.count}
                            </span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* User profile */}
      {userProfile && (
        <div className="border-t border-border p-4 mt-auto">
          <div className={cn(
            "flex items-center gap-3",
            isCollapsed && "justify-center"
          )}>
            {userProfile.avatar ? (
              <img 
                src={userProfile.avatar} 
                alt={userProfile.name} 
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center">
                {userProfile.name.charAt(0)}
              </div>
            )}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span 
                  className="text-sm font-medium"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {userProfile.name}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.aside>
  );
} 