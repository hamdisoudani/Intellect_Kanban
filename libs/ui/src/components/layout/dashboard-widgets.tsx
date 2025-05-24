"use client";

import React from 'react';
import { cn } from '@intellect-kanban/utils';
import Link from 'next/link';

// Card wrapper for dashboard components
export interface DashboardCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DashboardCard({
  title,
  description,
  icon,
  action,
  children,
  className
}: DashboardCardProps) {
  return (
    <div 
      className={cn(
        "bg-card text-card-foreground rounded-lg border border-border/40 shadow-sm",
        "transition-all duration-200 hover:shadow-md hover:border-border/60",
        className
      )}
    >
      {(title || icon || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            <div>
              {title && <h3 className="text-base font-medium">{title}</h3>}
              {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
            </div>
          </div>
          {action && <div className="flex items-center">{action}</div>}
        </div>
      )}
      <div className={cn(
        "p-6",
        !title && !icon && !action ? "" : ""
      )}>
        {children}
      </div>
    </div>
  );
}

// Stat Card for metrics display
export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  chart?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  chart,
  action,
  className
}: StatCardProps) {
  return (
    <DashboardCard
      className={cn("overflow-hidden", className)}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-semibold tracking-tight">{value}</div>
          {trend && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className={cn(
                  "text-xs font-medium px-1.5 py-0.5 rounded-full", 
                  trend.isPositive 
                    ? "bg-chart-1/15 text-chart-1" 
                    : "bg-destructive/15 text-destructive"
                )}
              >
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-muted-foreground">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>
        {chart && <div className="h-16">{chart}</div>}
      </div>

      {action && (
        <div className="mt-4 pt-4 border-t border-border/30">
          {action}
        </div>
      )}
    </DashboardCard>
  );
}

// Status badges for showing status like "In Progress", "Completed", etc.
export interface StatusBadgeProps {
  status: 'in-progress' | 'not-started' | 'completed' | 'due-soon' | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusStyles: Record<string, string> = {
    'in-progress': 'bg-chart-3/15 text-chart-3 border-chart-3/30',
    'not-started': 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30',
    'completed': 'bg-chart-1/15 text-chart-1 border-chart-1/30',
    'due-soon': 'bg-chart-5/15 text-chart-5 border-chart-5/30',
  };

  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '-');
  const style = statusStyles[normalizedStatus] || 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30';

  return (
    <span className={cn(
      "inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-medium rounded-full border",
      style,
      className
    )}>
      {status}
    </span>
  );
}

// Simple action link for "See Details" buttons
export interface SeeDetailsLinkProps {
  href: string;
  label?: string;
  className?: string;
}

export function SeeDetailsLink({ 
  href, 
  label = "See Details", 
  className 
}: SeeDetailsLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80", 
        className
      )}
    >
      {label}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform group-hover:translate-x-0.5"
      >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </Link>
  );
}

// Widget grid system for responsive layouts
export interface WidgetGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function WidgetGrid({ 
  children, 
  columns = 3, 
  className 
}: WidgetGridProps) {
  const gridColsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2 gap-x-6",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6",
  }[columns];

  return (
    <div className={cn(`grid gap-6 ${gridColsClass}`, className)}>
      {children}
    </div>
  );
} 