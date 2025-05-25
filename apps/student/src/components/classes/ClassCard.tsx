"use client";

import { 
  Card, 
  Button,
  StatusBadge
} from '@intellect-kanban/ui';
import { Class } from '@/types';
import { Users, Calendar, ExternalLink, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface ClassCardProps {
  classData: Class;
  onView: (classId: string) => void;
}

export function ClassCard({ classData, onView }: ClassCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const studentCount = classData.joinedUsers.length;
  const formattedDate = new Date(classData.createdAt).toLocaleDateString();
  const teacherName = classData.createdBy?.name || 'Unknown Teacher';

  return (
    <Card 
      className="overflow-hidden transition-all hover:border-primary/30 h-full flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Header */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen size={15} className="text-primary" />
            </div>
            <h3 className="text-xl font-semibold truncate">{classData.name}</h3>
          </div>
          <StatusBadge status="active" className="text-xs" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Calendar size={14} />
          <span>{formattedDate}</span>
        </div>
      </div>
      
      {/* Card Content */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-full">
            <Users size={14} />
            <span className="text-sm font-medium">{studentCount} student{studentCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        <div className="mt-auto">
          <p className="text-sm font-medium mb-2">Teacher:</p>
          <div className="flex items-center gap-2 p-1.5 px-3 bg-muted/20 rounded-md">
            <span className="text-sm">{teacherName}</span>
          </div>
        </div>
      </div>
      
      {/* Card Footer */}
      <div className="p-4 bg-muted/5 border-t border-border/20 mt-auto">
        <motion.div 
          className="w-full"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            onClick={() => onView(classData._id)}
            variant="default"
            className="w-full"
          >
            <span>View Class</span>
            <ExternalLink size={14} className="ml-2" />
          </Button>
        </motion.div>
      </div>
    </Card>
  );
} 