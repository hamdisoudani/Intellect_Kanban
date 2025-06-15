"use client";

import { useState, useEffect } from 'react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@intellect-kanban/ui';
import { toast } from 'sonner';
import { StudentOption, Column } from '@/utils/types';
import { PlusCircle, ChevronRight, Calendar, Users, LayoutGrid, Tag as TagIcon, Plus, Search, Check } from 'lucide-react';
import { Tag } from '../ui/Tag';
import { useTags } from '@/hooks/useTags';
import { Tag as TagType, CreateTagDto } from '@/types/tags';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DifficultyLevel, difficultyLevelLabels } from '@/types/activities';
import { DifficultyBadge } from './DifficultyBadge';

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
    .nullable(),
  tags: Yup.array()
    .max(5, 'Maximum 5 tags allowed'),
  difficultyLevel: Yup.string()
    .oneOf(Object.values(DifficultyLevel), 'Invalid difficulty level')
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
    }),
  tags: Yup.array()
    .max(5, 'Maximum 5 tags allowed'),
  difficultyLevel: Yup.string()
    .oneOf(Object.values(DifficultyLevel), 'Invalid difficulty level')
});

// Add the validation schema for creating a new tag after the existing schemas
// Validation schema for creating a new tag
const tagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Tag name cannot exceed 50 characters'),
  description: z.string().max(200, 'Description cannot exceed 200 characters').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
});

type TagFormValues = z.infer<typeof tagSchema>;

// Predefined colors for quick selection
const PREDEFINED_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#6B7280', // Gray
];

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

// Here is the CreateTagDialog component implementation that should be moved outside the CreateActivityDialog
// Remove it from inside the CreateActivityDialog and place it here
interface CreateTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTagCreated: (tag: TagType) => void;
  onCreateTag: (tag: CreateTagDto) => Promise<TagType | null>;
}

function CreateTagDialog({ open, onOpenChange, onTagCreated, onCreateTag }: CreateTagDialogProps) {
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: '',
      description: '',
      color: PREDEFINED_COLORS[0]
    }
  });
  
  const handleCreateTag = async (values: TagFormValues) => {
    try {
      const newTag = await onCreateTag({
        name: values.name,
        description: values.description || undefined,
        color: values.color
      });
      
      if (newTag) {
        // Close create dialog
        onOpenChange(false);
        
        // Reset form
        form.reset();
        
        // Call the callback with the new tag
        onTagCreated(newTag);
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
      toast.error('Failed to create tag');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            Create New Tag
          </DialogTitle>
        </DialogHeader>
        
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleCreateTag)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter tag name" 
                      className="bg-gray-800 border-gray-700 focus-visible:ring-gray-700"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter tag description" 
                      className="bg-gray-800 border-gray-700 focus-visible:ring-gray-700"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PREDEFINED_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          "w-8 h-8 rounded-full relative transition-all",
                          field.value === color && "ring-2 ring-offset-2 ring-primary ring-offset-gray-900"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => form.setValue('color', color)}
                      >
                        {field.value === color && (
                          <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                        )}
                      </button>
                    ))}
                    
                    <div className="flex items-center gap-2 ml-1">
                      <Input
                        type="color"
                        className="w-8 h-8 p-0.5 rounded-full cursor-pointer"
                        value={field.value}
                        onChange={(e) => form.setValue('color', e.target.value)}
                      />
                      <Input
                        type="text"
                        className="w-24 h-8 bg-gray-800 border-gray-700"
                        value={field.value}
                        onChange={(e) => form.setValue('color', e.target.value)}
                      />
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Tag</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

// Now in the CreateActivityDialog component, keep track of the selected tag info to pass to the CreateTagDialog
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateTagDialogOpen, setIsCreateTagDialogOpen] = useState(false);
  
  // Use the tags hook
  const { tags, isLoading: isLoadingTags, createTag } = useTags();
  
  // Reset activity type when dialog closes
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setActivityType(initialColumnId ? 'personal' : null);
      if (onClose) onClose();
      if (onOpenChange) onOpenChange(open);
    }
  };

  // Filter tags based on search term
  const getFilteredTags = (selectedTags: TagType[] = []) => {
    const selectedIds = selectedTags.map(tag => tag._id);
    
    return tags
      .filter(tag => !selectedIds.includes(tag._id))
      .filter(tag => 
        tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tag.description && tag.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
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
        difficultyLevel: values.difficultyLevel || DifficultyLevel.DEVELOPING,
      };
      
      // For personal activities, include the columnId
      if (activityType === 'personal' && values.columnId) {
        payload.columnId = values.columnId;
        // The backend will handle creating the column history automatically
      }
      
      // For meta activities, include assigned students if applicable
      if (activityType === 'meta') {
        // Only include assignedStudents if the checkbox is checked
        if (values.assignStudents && Array.isArray(values.assignedStudents) && values.assignedStudents.length > 0) {
          // Make sure we're only sending valid string IDs
          payload.assignedStudents = values.assignedStudents.filter((id: any) => typeof id === 'string' && id.trim().length > 0);
          console.log("Filtered assignedStudents:", payload.assignedStudents);
        } else {
          // Make sure we're not sending an empty array
          delete payload.assignedStudents;
        }
      }
      
      // Include tags if selected
      if (values.tags && values.tags.length > 0) {
        payload.tags = values.tags.map((tag: TagType) => tag._id);
      }
      
      console.log('Submitting new activity from CreateActivityDialog:', payload);
      
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
      
      // Close the dialog
      handleDialogOpenChange(false);
      
      // Call the callback with the new activity - it will show its own success notification
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
        tags: [],
        difficultyLevel: DifficultyLevel.DEVELOPING,
      };
    } else {
      return {
        title: '',
        description: '',
        dueDate: '',
        assignStudents: false,
        assignedStudents: [] as string[],
        tags: [],
        difficultyLevel: DifficultyLevel.DEVELOPING,
      };
    }
  };

  // Reset search term when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  return (
    <>
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
                  {({ errors, touched, values, setFieldValue }) => {
                    // Add effect to handle custom events for tag creation
                    useEffect(() => {
                      const handleAddTag = (e: any) => {
                        if (e.detail && e.detail.tag) {
                          // Only add the tag if we're not at the limit yet
                          const currentTags = values.tags || [];
                          if (currentTags.length < 5) {
                            setFieldValue('tags', [...currentTags, e.detail.tag]);
                          }
                        }
                      };
                      
                      // Add event listener
                      document.addEventListener('add-tag', handleAddTag);
                      
                      // Cleanup
                      return () => {
                        document.removeEventListener('add-tag', handleAddTag);
                      };
                    }, [values.tags, setFieldValue]);
                    
                    return (
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
                                <p className="text-destructive text-xs">{errors.dueDate as string}</p>
                              )}
                            </div>

                            {/* Difficulty Level */}
                            <div className="space-y-2">
                              <Label htmlFor="difficultyLevel">Difficulty Level</Label>
                              <Select
                                value={values.difficultyLevel}
                                onValueChange={(value) => setFieldValue('difficultyLevel', value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue>
                                    <div className="flex items-center gap-2">
                                      <DifficultyBadge 
                                        difficultyLevel={values.difficultyLevel as DifficultyLevel} 
                                        size="sm"
                                      />
                                      <span>{difficultyLevelLabels[values.difficultyLevel as DifficultyLevel]}</span>
                                    </div>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(DifficultyLevel).map((level) => (
                                    <SelectItem key={level} value={level}>
                                      <div className="flex items-center gap-2">
                                        <DifficultyBadge difficultyLevel={level} size="sm" />
                                        <span>{difficultyLevelLabels[level]}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {errors.difficultyLevel && touched.difficultyLevel && (
                                <p className="text-destructive text-xs">{errors.difficultyLevel as string}</p>
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
                                <p className="text-destructive text-xs">{errors.dueDate as string}</p>
                              )}
                            </div>

                            {/* Student Assignment */}
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <Field 
                                  as={Checkbox} 
                                  id="assignStudents" 
                                  name="assignStudents" 
                                  checked={values.assignStudents}
                                  onCheckedChange={(checked: boolean) => {
                                    setFieldValue('assignStudents', checked);
                                    if (!checked) {
                                      setFieldValue('assignedStudents', []);
                                    }
                                  }}
                                />
                                <Label 
                                  htmlFor="assignStudents"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Assign to students now
                                </Label>
                              </div>
                            
                              {values.assignStudents && (
                                <div className="ml-6 space-y-2">
                                  <p className="text-sm text-muted-foreground">
                                    Select students to assign this activity to:
                                  </p>
                                  <div className="space-y-1 max-h-48 overflow-y-auto p-2 border rounded-md">
                                    {students.length > 0 ? (
                                      students.map((student) => (
                                        <div key={student.id} className="flex items-center space-x-2">
                                          <Field
                                            as={Checkbox}
                                            id={`student-${student.id}`}
                                            name="assignedStudents"
                                            value={student._id || student.id}
                                            checked={values.assignedStudents.includes(student._id || student.id)}
                                            onCheckedChange={(checked: boolean) => {
                                              const currentValues = [...values.assignedStudents];
                                              // Student.id is actually mapped from student._id in the component
                                              // Ensure we use the actual MongoDB ID
                                              const studentId = student._id || student.id;
                                              if (checked) {
                                                currentValues.push(studentId);
                                              } else {
                                                const index = currentValues.indexOf(studentId);
                                                if (index !== -1) {
                                                  currentValues.splice(index, 1);
                                                }
                                              }
                                              setFieldValue('assignedStudents', currentValues);
                                            }}
                                          />
                                          <Label
                                            htmlFor={`student-${student.id}`}
                                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                          >
                                            {student.name}
                                          </Label>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-sm text-center text-muted-foreground py-2">
                                        No students available
                                      </p>
                                    )}
                                  </div>
                                  {errors.assignedStudents && touched.assignedStudents && (
                                    <p className="text-destructive text-xs">{errors.assignedStudents as string}</p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Difficulty Level */}
                            <div className="space-y-2">
                              <Label htmlFor="difficultyLevel">Difficulty Level</Label>
                              <Select
                                value={values.difficultyLevel}
                                onValueChange={(value) => setFieldValue('difficultyLevel', value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue>
                                    <div className="flex items-center gap-2">
                                      <DifficultyBadge 
                                        difficultyLevel={values.difficultyLevel as DifficultyLevel} 
                                        size="sm"
                                      />
                                      <span>{difficultyLevelLabels[values.difficultyLevel as DifficultyLevel]}</span>
                                    </div>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(DifficultyLevel).map((level) => (
                                    <SelectItem key={level} value={level}>
                                      <div className="flex items-center gap-2">
                                        <DifficultyBadge difficultyLevel={level} size="sm" />
                                        <span>{difficultyLevelLabels[level]}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {errors.difficultyLevel && touched.difficultyLevel && (
                                <p className="text-destructive text-xs">{errors.difficultyLevel as string}</p>
                              )}
                            </div>
                          </>
                        )}

                        {/* Tags - for both types */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <Label className="text-sm font-medium text-gray-200">
                              Tags
                            </Label>
                            <span className="text-xs text-muted-foreground">
                              {(values.tags?.length || 0)}/5
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 min-h-[2.5rem] mb-2">
                            <AnimatePresence>
                              {(values.tags || []).map((tag: TagType) => (
                                <Tag
                                  key={tag._id}
                                  label={tag.name}
                                  color={tag.color}
                                  onRemove={() => {
                                    const newTags = (values.tags || []).filter((t: TagType) => t._id !== tag._id);
                                    setFieldValue('tags', newTags);
                                  }}
                                  size="md"
                                />
                              ))}
                            </AnimatePresence>
                            
                            {(!values.tags || values.tags.length < 5) && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button 
                                    type="button"
                                    variant="outline" 
                                    size="sm" 
                                    className="gap-1 h-8 border-dashed border-gray-300/50 hover:border-gray-300 transition-colors bg-transparent"
                                    disabled={isSubmitting}
                                  >
                                    <Plus size={16} />
                                    Add Tag
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[260px] p-0 rounded-md border-gray-800 bg-gray-900" align="start" sideOffset={5}>
                                  <div className="p-2 border-b border-gray-800">
                                    <div className="relative">
                                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        placeholder="Search tags..."
                                        className="pl-8 h-9 bg-gray-800 border-gray-700 focus-visible:ring-gray-700"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="max-h-52 overflow-y-auto py-1">
                                    {getFilteredTags(values.tags).length > 0 ? (
                                      <div className="py-1">
                                        {getFilteredTags(values.tags).map(tag => (
                                          <button
                                            key={tag._id}
                                            type="button"
                                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-800 text-left"
                                            onClick={() => {
                                              const newTags = [...(values.tags || []), tag];
                                              setFieldValue('tags', newTags);
                                            }}
                                          >
                                            <div
                                              className="w-3 h-3 rounded-full"
                                              style={{ backgroundColor: tag.color }}
                                            />
                                            <span className="text-sm text-gray-200">{tag.name}</span>
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="p-3 text-center text-sm text-muted-foreground">
                                        {searchTerm ? 'No matching tags found' : 'No available tags'}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <Separator className="bg-gray-800" />
                                  <button
                                    type="button"
                                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-800 text-left"
                                    onClick={() => {
                                      setIsCreateTagDialogOpen(true);
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                    <span className="text-sm font-medium">Create new tag</span>
                                  </button>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                          
                          {errors.tags && touched.tags && (
                            <p className="text-destructive text-xs">{errors.tags as string}</p>
                          )}
                        </div>

                        <DialogFooter>
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
                          >
                            {isSubmitting ? 'Creating...' : 'Create Activity'}
                          </Button>
                        </DialogFooter>
                      </Form>
                    );
                  }}
                </Formik>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
      
      {/* Render CreateTagDialog outside of Formik context */}
      {isCreateTagDialogOpen && (
        <CreateTagDialog
          open={isCreateTagDialogOpen}
          onOpenChange={setIsCreateTagDialogOpen}
          onTagCreated={(newTag) => {
            // Dispatch custom event to notify form about new tag
            const event = new CustomEvent('add-tag', { 
              detail: { tag: newTag } 
            });
            document.dispatchEvent(event);
            
            // Close dialog and show success message
            setIsCreateTagDialogOpen(false);
            toast.success('Tag created successfully!');
          }}
          onCreateTag={createTag}
        />
      )}
    </>
  );
} 