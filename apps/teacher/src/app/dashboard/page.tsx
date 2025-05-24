import React from 'react';
import {
  DashboardPage,
  DashboardCard,
  StatCard,
  WidgetGrid,
  SeeDetailsLink,
  StatusBadge,
  Button,
} from '@intellect-kanban/ui';

export default function TeacherDashboard() {
  return (
    <DashboardPage
      title="Dashboard"
      description="Track your classes, students and assignments"
      actions={
        <Button variant="default" size="sm">
          Add Widget
        </Button>
      }
    >
      {/* Overview Stats */}
      <WidgetGrid columns={3}>
        <StatCard
          title="Active Classes"
          value={5}
          trend={{ value: 20, isPositive: true, label: 'vs last month' }}
          action={<SeeDetailsLink href="/dashboard/classes" />}
        />
        <StatCard
          title="Total Students"
          value={124}
          trend={{ value: 12, isPositive: true, label: 'vs last month' }}
          action={<SeeDetailsLink href="/dashboard/students" />}
        />
        <StatCard
          title="Pending Assignments"
          value={27}
          trend={{ value: 5, isPositive: false, label: 'vs last week' }}
          action={<SeeDetailsLink href="/dashboard/assignments" />}
        />
      </WidgetGrid>

      {/* Recent Activities */}
      <DashboardCard
        title="Recent Activities"
        action={<SeeDetailsLink href="/dashboard/activities" />}
      >
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 border border-border/30 rounded-lg flex items-center justify-between hover:border-border/60 transition-colors"
            >
              <div>
                <h4 className="font-medium">Project {i} - Unit Testing</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Due: {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge 
                  status={i === 1 ? 'In Progress' : i === 2 ? 'Not Started' : 'Completed'} 
                />
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      <WidgetGrid columns={2}>
        {/* Class Performance */}
        <DashboardCard
          title="Class Performance"
          action={<SeeDetailsLink href="/dashboard/analytics" />}
        >
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-16 font-medium">Class {i}</span>
                <div className="flex-1 bg-muted/40 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-chart-1 h-full rounded-full"
                    style={{ width: `${65 + i * 10}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium w-10 text-right">{65 + i * 10}%</span>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Recent Submissions */}
        <DashboardCard
          title="Recent Submissions"
          action={<SeeDetailsLink href="/dashboard/submissions" />}
        >
          <div className="divide-y divide-border/30">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <span className="font-medium">Student {i}</span>
                <span className="text-sm">Project {i}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </WidgetGrid>
    </DashboardPage>
  );
} 