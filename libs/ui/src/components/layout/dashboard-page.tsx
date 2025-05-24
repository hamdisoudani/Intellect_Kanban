"use client";

import React from 'react';
import { cn } from '@intellect-kanban/utils';
import { motion } from 'framer-motion';

export interface DashboardPageProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DashboardPage({ 
  title, 
  description, 
  actions, 
  children, 
  className 
}: DashboardPageProps) {
  // Only show the header section if there's a title, description or actions
  const showHeader = title || description || actions;
  
  return (
    <div className={cn("space-y-8", className)}>
      {showHeader && (
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/30"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3 mt-2 sm:mt-0 shrink-0">
              {actions}
            </div>
          )}
        </motion.div>
      )}
      <div className={cn("space-y-8", !showHeader && "pt-0")}>
        {children}
      </div>
    </div>
  );
} 