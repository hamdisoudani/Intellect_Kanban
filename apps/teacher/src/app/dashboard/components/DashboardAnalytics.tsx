"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TeacherDashboardAnalytics } from '@/utils/types';
import { 
  StatCard, 
  DashboardCard,
  WidgetGrid,
  SeeDetailsLink,
  Button
} from '@intellect-kanban/ui';
import { toast } from 'sonner';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { ClassPerformanceTable } from './ClassPerformanceTable';
import { PopularTagsTable } from './PopularTagsTable';

// Enhanced color palette
const COLORS = ['#EC4899', '#8B5CF6', '#3B82F6', '#10B981'];
const CHART_COLORS = {
  primary: '#8884d8',
  secondary: '#82ca9d',
  accent: '#ffc658',
  highlight: '#ff8042',
  muted: 'rgba(255, 255, 255, 0.6)'
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20
    }
  }
};

const chartVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
};

const barVariants = {
  hidden: { scaleY: 0 },
  visible: { 
    scaleY: 1,
    transition: {
      duration: 0.8,
      ease: 'easeOut'
    }
  }
};

export function DashboardAnalytics() {
  const [analytics, setAnalytics] = useState<TeacherDashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load dashboard analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!analytics) {
    return (
      <motion.div 
        className="p-8 text-center bg-muted/10 rounded-lg shadow-lg border border-muted/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-xl font-medium mb-3">Analytics Unavailable</h3>
        <p className="text-muted-foreground mb-5 max-w-md mx-auto">
          We couldn't load your dashboard data at this time. Please check your connection and try again.
        </p>
        <Button onClick={fetchAnalytics} className="px-6">
          <motion.span 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Retry
          </motion.span>
        </Button>
      </motion.div>
    );
  }

  // Custom tooltip component for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-border p-3 rounded-md shadow-lg backdrop-blur-sm">
          <p className="font-medium text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Overview Stats */}
      <WidgetGrid columns={4}>
        {[
          { title: "Active Classes", value: analytics.statCards.activeClasses, href: "/dashboard/classes" },
          { title: "Total Students", value: analytics.statCards.totalStudents, href: "/dashboard/students" },
          { title: "Personal Activities", value: analytics.statCards.personalActivities, href: "/dashboard/activities" },
          { title: "Class Activities", value: analytics.statCards.metaActivities, href: "/dashboard/assignments" }
        ].map((stat, index) => (
          <motion.div key={index} variants={itemVariants}>
            <StatCard
              title={stat.title}
              value={stat.value}
              action={<SeeDetailsLink href={stat.href} />}
              className="transition-all hover:shadow-md"
            />
          </motion.div>
        ))}
      </WidgetGrid>

      <WidgetGrid columns={2}>
        {/* Assignment Status Chart */}
        <motion.div variants={itemVariants}>
          <DashboardCard title="Assignment Status Distribution" className="overflow-hidden">
            <motion.div 
              className="h-[320px] p-4" 
              variants={chartVariants}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {COLORS.map((color, index) => (
                      <linearGradient key={`gradient-${index}`} id={`colorGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={1} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={analytics.assignmentsByStatusChart}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    innerRadius={40}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="status"
                    animationDuration={1500}
                    animationBegin={300}
                  >
                    {analytics.assignmentsByStatusChart.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#colorGradient${index % COLORS.length})`}
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    formatter={(value) => <span className="text-sm font-medium">{value}</span>} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </DashboardCard>
        </motion.div>

        {/* Activity Creation Chart */}
        <motion.div variants={itemVariants}>
          <DashboardCard title="Activity Creation Trend" className="overflow-hidden">
            <motion.div 
              className="h-[320px] p-4"
              variants={chartVariants}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analytics.activityCreationChart}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 0,
                    bottom: 60,
                  }}
                >
                  <defs>
                    <linearGradient id="personalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="metaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false} 
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis 
                    dataKey="month" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  />
                  <YAxis 
                    tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} 
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    formatter={(value) => <span className="text-sm font-medium">{value}</span>} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="personal" 
                    name="Personal Activities" 
                    strokeWidth={2}
                    stroke="#8884d8" 
                    fillOpacity={1}
                    fill="url(#personalGradient)" 
                    activeDot={{ r: 6, stroke: '#FFF', strokeWidth: 2 }}
                    animationDuration={1500}
                    animationBegin={300}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="meta" 
                    name="Class Activities" 
                    strokeWidth={2}
                    stroke="#82ca9d" 
                    fillOpacity={1}
                    fill="url(#metaGradient)" 
                    activeDot={{ r: 6, stroke: '#FFF', strokeWidth: 2 }}
                    animationDuration={1500}
                    animationBegin={600}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </DashboardCard>
        </motion.div>
      </WidgetGrid>

      <WidgetGrid columns={2}>
        {/* Tag Usage Chart */}
        <motion.div variants={itemVariants}>
          <DashboardCard title="Popular Tags">
            {analytics.tagUsageChart.length > 0 ? (
              <PopularTagsTable data={analytics.tagUsageChart} />
            ) : (
              <motion.p 
                className="text-muted-foreground text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                No tag data available
              </motion.p>
            )}
          </DashboardCard>
        </motion.div>

        {/* Class Performance */}
        <motion.div variants={itemVariants}>
          <DashboardCard title="Class Performance">
            {analytics.classPerformanceTable.length > 0 ? (
              <ClassPerformanceTable data={analytics.classPerformanceTable} />
            ) : (
              <motion.p 
                className="text-muted-foreground text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                No class data available
              </motion.p>
            )}
          </DashboardCard>
        </motion.div>
      </WidgetGrid>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <WidgetGrid columns={4}>
        {[...Array(4)].map((_, i) => (
          <motion.div 
            key={i} 
            className="bg-muted/20 h-28 rounded-lg overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <motion.div 
              className="h-full w-full bg-gradient-to-r from-muted/5 to-muted/20"
              animate={{ 
                x: ['-100%', '100%'],
              }}
              transition={{ 
                repeat: Infinity,
                repeatType: "loop",
                duration: 1.5,
                ease: "linear",
              }}
            />
          </motion.div>
        ))}
      </WidgetGrid>

      <WidgetGrid columns={2}>
        {[...Array(2)].map((_, i) => (
          <motion.div 
            key={i} 
            className="bg-muted/20 h-[320px] rounded-lg overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
          >
            <motion.div 
              className="h-full w-full bg-gradient-to-r from-muted/5 to-muted/20"
              animate={{ 
                x: ['-100%', '100%'],
              }}
              transition={{ 
                repeat: Infinity,
                repeatType: "loop",
                duration: 1.5,
                ease: "linear",
              }}
            />
          </motion.div>
        ))}
      </WidgetGrid>

      <WidgetGrid columns={2}>
        {[...Array(2)].map((_, i) => (
          <motion.div 
            key={i} 
            className="bg-muted/20 h-[220px] rounded-lg overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
          >
            <motion.div 
              className="h-full w-full bg-gradient-to-r from-muted/5 to-muted/20"
              animate={{ 
                x: ['-100%', '100%'],
              }}
              transition={{ 
                repeat: Infinity,
                repeatType: "loop",
                duration: 1.5,
                ease: "linear",
              }}
            />
          </motion.div>
        ))}
      </WidgetGrid>
    </motion.div>
  );
} 