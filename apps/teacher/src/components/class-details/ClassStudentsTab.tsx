"use client";

import { useState } from 'react';
import {
  Card,
  CardContent,
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Input
} from '@intellect-kanban/ui';
import { User } from '@/utils/types/classes';
import { UsersIcon, UserMinusIcon, SearchIcon, MailIcon, UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ClassStudentsTabProps {
  students: User[];
  onRemoveStudent: (studentId: string) => Promise<void>;
}

export function ClassStudentsTab({ students, onRemoveStudent }: ClassStudentsTabProps) {
  const [studentToRemove, setStudentToRemove] = useState<User | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRemoveClick = (student: User) => {
    setStudentToRemove(student);
  };

  const handleRemoveConfirm = async () => {
    if (!studentToRemove) return;
    
    setIsRemoving(true);
    try {
      await onRemoveStudent(studentToRemove._id);
    } finally {
      setIsRemoving(false);
      setStudentToRemove(null);
    }
  };

  // Filter students based on search query
  const filteredStudents = searchQuery 
    ? students.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        student.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    : students;

  // Framer Motion variants
  const listVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.03 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-3">
      {students.length > 0 && (
        <div className="relative mb-3">
          <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            className="pl-7 h-9 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {students.length === 0 ? (
        <Card className="bg-muted/20 border-dashed">
          <CardContent className="flex flex-col items-center text-center py-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <UsersIcon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-medium">No students yet</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Share the invitation code with your students to join this class.
            </p>
          </CardContent>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-6 bg-muted/20 rounded-lg">
          <p className="text-sm text-muted-foreground">No students match your search</p>
        </div>
      ) : (
        <motion.div 
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {filteredStudents.map((student) => (
            <motion.div 
              key={student._id} 
              variants={itemVariants}
              className="flex items-center justify-between p-2.5 bg-card rounded-lg border hover:border-border/80 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserIcon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="overflow-hidden">
                  <div className="font-medium text-sm truncate">{student.name}</div>
                  {student.email && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                      <MailIcon className="h-2.5 w-2.5 flex-shrink-0" />
                      <span className="truncate">{student.email}</span>
                    </div>
                  )}
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveClick(student)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                  >
                    <UserMinusIcon size={14} className="mr-1" />
                    Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Student</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove <strong>{student.name}</strong> from this class? 
                      They will lose access to all boards and activities in this class.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRemoveConfirm}
                      disabled={isRemoving}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isRemoving ? 'Removing...' : 'Remove'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
} 