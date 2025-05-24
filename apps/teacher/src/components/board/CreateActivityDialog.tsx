"use client";

import { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@intellect-kanban/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Label,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  RadioGroup,
  RadioGroupItem
} from '@intellect-kanban/ui';
import { toast } from 'sonner';
import { StudentOption, Column } from '@/utils/types';
import { PlusCircle, CheckCircle, ChevronRight, Calendar, Users, LayoutGrid } from 'lucide-react';

// Type definition for student option with proper id field
interface ExtendedStudentOption extends StudentOption {
  id: string;
  name: string;
}

// Validation schema for personal activities
const PersonalActivitySchema = Yup.object().shape({
  title: Yup.string()
    .min(3, 'Too short')
    .max(100, 'Too long')
    .required('Required'),
  description: Yup.string()
    .max(500, 'Too long'),
  columnId: Yup.string()
    .required('Required for UI organization'),
  dueDate: Yup.date()
    .min(new Date(), 'Due date cannot be in the past')
    .nullable()
});

// Validation schema for class activities
const ClassActivitySchema = Yup.object().shape({
  title: Yup.string()
    .min(3, 'Too short')
    .max(100, 'Too long')
    .required('Required'),
  description: Yup.string()
    .max(500, 'Too long'),
  dueDate: Yup.date()
    .min(new Date(), 'Due date cannot be in the past')
    .nullable(),
  assignStudents: Yup.boolean(),
  assignedStudents: Yup.array().of(Yup.string())
    .when('assignStudents', {
      is: true,
      then: schema => schema.min(1, 'Select at least one student')
        .required('Required when assigning students'),
      otherwise: schema => schema.optional()
    })
});

interface CreateActivityDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  boardId: string;
  columns?: Column[];
  students: ExtendedStudentOption[];
  onActivityCreated: (activity: any) => void;
  showMetaOption?: boolean;
  initialColumnId?: string | null;
}

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

export function CreateActivityDialog({
  isOpen,
  onClose,
  onOpenChange,
  boardId,
  columns = [],
  students,
  onActivityCreated,
  showMetaOption = false,
  initialColumnId
}: CreateActivityDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activityType, setActivityType] = useState<null | 'personal' | 'meta'>(
    initialColumnId ? 'personal' : null
  );
  
  // Reset activity type when dialog closes
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setActivityType(initialColumnId ? 'personal' : null);
      if (onClose) onClose();
      if (onOpenChange) onOpenChange(open);
    }
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      
      // Adjust values before submission
      const payload: any = {
        title: values.title,
        description: values.description,
        type: activityType,
        boardId,
        dueDate: values.dueDate || undefined,
      };
      
      // For personal activities, include the columnId
      if (activityType === 'personal' && values.columnId) {
        payload.columnId = values.columnId;
        // The backend will handle creating the column history automatically
      }
      
      // For meta activities, include assigned students if applicable
      if (activityType === 'meta' && values.assignStudents) {
        payload.assignedStudents = values.assignedStudents;
      }
      
      console.log('Submitting new activity:', payload);
      
      // Use the API endpoint
      const response = await fetch(`/api/board/${boardId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to create activity');
      }
      
      const newActivity = await response.json();
      toast.success('Activity created successfully');
      
      // Close the dialog
      handleDialogOpenChange(false);
      
      // Call the callback with the new activity
      onActivityCreated(newActivity);
    } catch (err) {
      console.error('Error creating activity:', err);
      toast.error('Failed to create activity', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get initial values based on activity type
  const getInitialValues = () => {
    if (activityType === 'personal') {
      return {
        title: '',
        description: '',
        columnId: initialColumnId || (columns.length > 0 ? columns[0].id : ''),
        dueDate: '',
      };
    } else {
      return {
        title: '',
        description: '',
        dueDate: '',
        assignStudents: false,
        assignedStudents: [] as string[],
      };
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={handleDialogOpenChange}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Activity</DialogTitle>
        </DialogHeader>
        
        <AnimatePresence mode="wait">
          {activityType === null ? (
            // Step 1: Choose activity type
            <motion.div
              key="activity-type-selection"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="py-4"
            >
              <h3 className="text-base font-medium mb-4">What type of activity do you want to create?</h3>
              
              <div className="space-y-3">
                <motion.div
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-all",
                    "hover:border-primary hover:bg-primary/5"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActivityType('personal')}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                      <PlusCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center">
                        Personal Activity
                        <ChevronRight className="h-4 w-4 ml-1 text-muted-foreground" />
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create an activity that's only visible to you
                      </p>
                    </div>
                  </div>
                </motion.div>
                
                {showMetaOption && (
                  <motion.div
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all",
                      "hover:border-primary hover:bg-primary/5"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActivityType('meta')}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium flex items-center">
                          Class Activity
                          <ChevronRight className="h-4 w-4 ml-1 text-muted-foreground" />
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Create an activity that can be assigned to students
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            // Step 2: Activity Details Form (based on type)
            <motion.div
              key="activity-details-form"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Formik
                initialValues={getInitialValues()}
                validationSchema={activityType === 'personal' ? PersonalActivitySchema : ClassActivitySchema}
                onSubmit={handleSubmit}
              >
                {({ errors, touched, values, setFieldValue }) => (
                  <Form className="space-y-4 py-2">
                    <div className="mb-4 pb-2 border-b">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <button 
                          type="button" 
                          className="text-primary hover:underline flex items-center"
                          onClick={() => setActivityType(null)}
                        >
                          Activity Type
                        </button>
                        <ChevronRight className="h-3 w-3 mx-2" />
                        <span className="font-medium text-foreground">
                          {activityType === 'personal' ? 'Personal Activity' : 'Class Activity'}
                        </span>
                      </div>
                    </div>

                    {/* Activity Title - for both types */}
                    <div className="space-y-2">
                      <Label htmlFor="title" className="flex items-center">
                        Title <span className="text-destructive ml-1">*</span>
                      </Label>
                      <Field
                        as={Input}
                        id="title"
                        name="title"
                        placeholder="Enter a title"
                        className="focus-visible:ring-primary"
                      />
                      {errors.title && touched.title && (
                        <p className="text-destructive text-xs">{errors.title}</p>
                      )}
                    </div>

                    {/* Activity Description - for both types */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Field
                        as={Textarea}
                        id="description"
                        name="description"
                        placeholder="Enter a description"
                        rows={3}
                        className="resize-none focus-visible:ring-primary"
                      />
                      {errors.description && touched.description && (
                        <p className="text-destructive text-xs">{errors.description}</p>
                      )}
                    </div>

                    {/* Type-specific fields */}
                    {activityType === 'personal' ? (
                      // Personal Activity Fields
                      <>
                        {/* Column Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="columnId" className="flex items-center">
                            Column <span className="text-destructive ml-1">*</span>
                          </Label>
                          <div className="flex items-center gap-2">
                            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                            <Select
                              value={values.columnId}
                              onValueChange={(value) => setFieldValue('columnId', value)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select a column" />
                              </SelectTrigger>
                              <SelectContent>
                                {columns.map((column) => (
                                  <SelectItem key={column.id} value={column.id}>
                                    {column.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {errors.columnId && touched.columnId && (
                            <p className="text-destructive text-xs">{errors.columnId}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            This is only used to determine initial placement in the UI
                          </p>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                          <Label htmlFor="dueDate">Due Date</Label>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <Field
                              as={Input}
                              id="dueDate"
                              name="dueDate"
                              type="date"
                              className="flex-1"
                            />
                          </div>
                          {errors.dueDate && touched.dueDate && (
                            <p className="text-destructive text-xs">{errors.dueDate}</p>
                          )}
                        </div>
                      </>
                    ) : (
                      // Class Activity Fields
                      <>
                        {/* Due Date */}
                        <div className="space-y-2">
                          <Label htmlFor="dueDate">Due Date</Label>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <Field
                              as={Input}
                              id="dueDate"
                              name="dueDate"
                              type="date"
                              className="flex-1"
                            />
                          </div>
                          {errors.dueDate && touched.dueDate && (
                            <p className="text-destructive text-xs">{errors.dueDate}</p>
                          )}
                        </div>
                        
                        {/* Student Assignment - Only for meta/class activities */}
                        {students.length > 0 && (
                          <div className="space-y-2 border-t pt-4 mt-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="assignStudents"
                                checked={values.assignStudents}
                                onCheckedChange={(checked) => {
                                  setFieldValue('assignStudents', checked);
                                  if (!checked) {
                                    setFieldValue('assignedStudents', []);
                                  }
                                }}
                              />
                              <Label
                                htmlFor="assignStudents"
                                className="cursor-pointer"
                              >
                                Assign to Students
                              </Label>
                            </div>
                            
                            <AnimatePresence>
                              {values.assignStudents && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="space-y-2 pl-6 pt-2">
                                    <Label>Select Students</Label>
                                    <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                                      {students.map((student) => {
                                        // Ensure we have a proper id
                                        const studentId = student.id;
                                        const studentName = student.name;
                                        
                                        return (
                                          <div key={studentId} className="flex items-center space-x-2 py-1">
                                            <Checkbox
                                              id={`student-${studentId}`}
                                              checked={values.assignedStudents.includes(studentId)}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setFieldValue('assignedStudents', [
                                                    ...values.assignedStudents,
                                                    studentId
                                                  ]);
                                                } else {
                                                  setFieldValue(
                                                    'assignedStudents',
                                                    values.assignedStudents.filter(id => id !== studentId)
                                                  );
                                                }
                                              }}
                                            />
                                            <Label 
                                              htmlFor={`student-${studentId}`}
                                              className="text-sm cursor-pointer"
                                            >
                                              {studentName}
                                            </Label>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    {errors.assignedStudents && touched.assignedStudents && (
                                      <p className="text-destructive text-xs">{errors.assignedStudents}</p>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </>
                    )}

                    <DialogFooter className="mt-6 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleDialogOpenChange(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={isSubmitting}
                        className="gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Create Activity
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </Form>
                )}
              </Formik>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
} 