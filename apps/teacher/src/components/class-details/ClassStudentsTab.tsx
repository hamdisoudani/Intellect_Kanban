"use client";

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { User } from '@/utils/types';
import { UsersIcon, UserMinusIcon, SearchIcon, MailIcon, UserIcon } from 'lucide-react';

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

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                Manage students who have joined this class
              </CardDescription>
            </div>
            {students.length > 0 && (
              <div className="relative w-full sm:w-64">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium">No students yet</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                Students need to join using the invitation code. Share the code or link with your students.
              </p>
            </div>
          ) : (
            <div>
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No students match your search</p>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 p-4 font-medium text-sm border-b bg-muted/30">
                    <div className="col-span-5">Name</div>
                    <div className="col-span-5">Email</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>
                  
                  {/* Table Body */}
                  <div className="divide-y">
                    {filteredStudents.map((student) => (
                      <div key={student._id} className="grid grid-cols-12 p-4 items-center">
                        <div className="col-span-5 flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{student.name}</span>
                        </div>
                        <div className="col-span-5 flex items-center gap-2 text-muted-foreground">
                          {student.email && (
                            <>
                              <MailIcon className="h-3.5 w-3.5" />
                              <span className="truncate">{student.email}</span>
                            </>
                          )}
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveClick(student)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <UserMinusIcon size={16} className="mr-2" />
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 