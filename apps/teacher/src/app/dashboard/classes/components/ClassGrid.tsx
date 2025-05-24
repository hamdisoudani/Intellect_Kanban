"use client";

import { ClassCard } from './ClassCard';
import { Class } from '@/utils/types';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// Custom animation for pulse gradient
const pulseAnimation = `
@keyframes pulseGradient {
  0% {
    transform: translateX(-100%);
  }
  50%, 100% {
    transform: translateX(100%);
  }
}

.animate-pulse-gradient {
  animation: pulseGradient 2s ease-in-out infinite;
}
`;

interface ClassGridProps {
  classes: Class[];
  isLoading?: boolean;
}

export function ClassGrid({ classes, isLoading = false }: ClassGridProps) {
  const router = useRouter();

  const handleManageClass = (classId: string) => {
    router.push(`/dashboard/classes/${classId}`);
  };

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Item animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: pulseAnimation }} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className="h-64 bg-muted/30 rounded-lg border border-border/20 shadow-sm overflow-hidden relative"
            >
              <div className="h-full w-full">
                <div className="h-12 w-1/2 bg-muted/50 rounded-md absolute left-6 top-6"></div>
                <div className="h-4 w-1/3 bg-muted/40 rounded-md absolute left-6 top-12 mt-4"></div>
                <div className="flex absolute left-6 top-28">
                  <div className="h-6 w-20 bg-muted/50 rounded-md"></div>
                </div>
                <div className="h-8 w-24 bg-muted/50 rounded-md absolute right-6 bottom-6"></div>
                
                <div className="absolute top-0 left-0 right-0 bottom-0">
                  <div className="animate-pulse-gradient absolute inset-0 bg-gradient-to-r from-transparent via-muted/10 to-transparent"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Empty state
  if (classes.length === 0) {
    return (
      <motion.div 
        className="text-center p-12 border rounded-lg bg-muted/10 border-dashed"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2z"></path>
            <path d="M13 7l-4 4l4 4"></path>
          </svg>
        </div>
        <h3 className="text-xl font-medium mb-2">No classes yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Create your first class to start organizing your teaching materials and assignments
        </p>
      </motion.div>
    );
  }

  // Classes grid
  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {classes.map((classItem) => (
        <motion.div key={classItem._id} variants={itemVariants}>
          <ClassCard
            classData={classItem}
            onManage={handleManageClass}
          />
        </motion.div>
      ))}
    </motion.div>
  );
} 