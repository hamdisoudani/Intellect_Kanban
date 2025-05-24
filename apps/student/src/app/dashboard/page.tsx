import React from 'react';
import {
  DashboardPage,
  DashboardCard,
  StatCard,
  WidgetGrid,
  SeeDetailsLink,
  Button,
} from '@intellect-kanban/ui';

export default function StudentDashboard() {
  return (
    <DashboardPage
      title="Dashboard"
      description="Track your classes and assignments"
      actions={
        <Button variant="default" size="sm">
          View Calendar
        </Button>
      }
    >
      {/* Overview Stats */}
      <WidgetGrid columns={3}>
        <StatCard
          title="Active Classes"
          value={3}
          trend={{ value: 0, isPositive: true, label: 'vs last month' }}
          action={<SeeDetailsLink href="/dashboard/classes" />}
        />
        <StatCard
          title="Pending Assignments"
          value={7}
          trend={{ value: 2, isPositive: false, label: 'vs last week' }}
          action={<SeeDetailsLink href="/dashboard/assignments" />}
        />
        <StatCard
          title="Completed Assignments"
          value={15}
          trend={{ value: 20, isPositive: true, label: 'vs last month' }}
          action={<SeeDetailsLink href="/dashboard/completed" />}
        />
      </WidgetGrid>

      {/* Upcoming Assignments */}
      <DashboardCard
        title="Upcoming Assignments"
        action={<SeeDetailsLink href="/dashboard/assignments" />}
      >
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 border rounded-md flex items-center justify-between"
            >
              <div>
                <h4 className="font-medium">Assignment {i} - Math Problem Set</h4>
                <p className="text-sm text-muted-foreground">
                  Due: {new Date(Date.now() + i * 86400000).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-secondary px-2 py-1 rounded-full text-secondary-foreground">
                  {i === 1 ? 'Due Soon' : i === 2 ? 'In Progress' : 'Not Started'}
                </span>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      <WidgetGrid columns={2}>
        {/* Class Schedule */}
        <DashboardCard
          title="Today's Classes"
          action={<SeeDetailsLink href="/dashboard/schedule" label="Full Schedule" />}
        >
          <div className="space-y-4">
            {[
              { name: 'Mathematics', time: '9:00 AM - 10:30 AM' },
              { name: 'Computer Science', time: '11:00 AM - 12:30 PM' },
              { name: 'Physics', time: '2:00 PM - 3:30 PM' },
            ].map((cls, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                <div>
                  <h4 className="font-medium">{cls.name}</h4>
                  <p className="text-sm text-muted-foreground">{cls.time}</p>
                </div>
                <Button variant="ghost" size="sm">Join</Button>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Performance Summary */}
        <DashboardCard
          title="Performance Summary"
          action={<SeeDetailsLink href="/dashboard/performance" />}
        >
          <div className="space-y-4">
            {['Mathematics', 'Computer Science', 'Physics'].map((subject, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{subject}</span>
                  <span className="text-sm">{70 + i * 8}%</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-chart-1 h-full"
                    style={{ width: `${70 + i * 8}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </WidgetGrid>
    </DashboardPage>
  );
} 