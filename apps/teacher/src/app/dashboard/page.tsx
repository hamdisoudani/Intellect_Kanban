"use client";

import React, { useEffect, useState } from 'react';
import { DashboardPage, DashboardCard } from '@intellect-kanban/ui';
import { DashboardAnalytics } from './components/DashboardAnalytics';
import { getSession } from '../../server/auth-actions';
import { motion } from 'framer-motion';

export default function TeacherDashboard() {
  const [user, setUser] = useState<any>(null);
  
  // Fetch session on component mount
  useEffect(() => {
    const fetchSession = async () => {
      const session = await getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };

    fetchSession();
  }, []);

  return (
    <DashboardPage
      title=" " 
    >
      {user && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DashboardCard>
            <div className="p-2">
              <h2 className="text-2xl font-bold">
                Welcome, {user.name || 'Teacher'}!
              </h2>
              <p className="text-muted-foreground mt-1">
                Here's an overview of your teaching activity
              </p>
            </div>
          </DashboardCard>
        </motion.div>
      )}
      
      <DashboardAnalytics />
    </DashboardPage>
  );
} 