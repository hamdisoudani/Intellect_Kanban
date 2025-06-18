"use client";

import { useState } from 'react';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  Input,
  Label,
  Textarea
} from '@intellect-kanban/ui';
import { createBoardSchema } from '@/utils/validation/board';
import { Board } from '@/utils/types';
import { PlusIcon, Loader2Icon } from 'lucide-react';

interface CreateBoardDialogProps {
  onBoardCreated: (newBoard: Board) => void;
  classId: string; // Class ID for the board
  variant?: "default" | "outline" | "secondary"; // Optional button variant
  size?: "default" | "sm" | "lg"; // Optional button size
  className?: string; // Optional className for custom styling
}

export function CreateBoardDialog({ 
  onBoardCreated, 
  classId, 
  variant = "default",
  size = "default",
  className
}: CreateBoardDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Simplified Yup schema for just name and description
  const boardSchema = createBoardSchema.pick(['name', 'description']);

  const handleSubmit = async (
    values: { name: string; description: string },
    { setSubmitting, resetForm }: FormikHelpers<{ name: string; description: string }>
  ) => {
    try {
      // Add classId to the payload
      const payload = { ...values, classId };

      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create board');
      }

      const newBoard = await response.json();
      
      // Success - close dialog and reset form
      toast.success('Board created successfully!', {
        description: `"${newBoard.name}" was created`
      });
      
      resetForm();
      setIsOpen(false);
      
      // Notify parent component about the new board
      onBoardCreated(newBoard);
    } catch (error) {
      toast.error('Failed to create board', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Simplified initial values for just name and description
  const initialValues = {
    name: '',
    description: ''
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Board
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
          <DialogDescription>
            Create a Kanban board to organize activities for this class.
          </DialogDescription>
        </DialogHeader>
        
        <Formik
          initialValues={initialValues}
          validationSchema={boardSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Board Name
                </Label>
                <Field
                  as={Input}
                  id="name"
                  name="name"
                  placeholder="Enter board name..."
                  className={errors.name && touched.name ? 'border-destructive' : ''}
                />
                {errors.name && touched.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description (Optional)
                </Label>
                <Field
                  as={Textarea}
                  id="description"
                  name="description"
                  placeholder="Enter board description..."
                  className={errors.description && touched.description ? 'border-destructive' : ''}
                  rows={3}
                />
                {errors.description && touched.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Board'
                  )}
                </Button>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
} 