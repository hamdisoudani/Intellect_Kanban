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
  Label
} from '@intellect-kanban/ui';
import { createClassSchema, createClassInitialValues } from '@/utils/validation/class';
import { CreateClassRequest, Class } from '@/utils/types';
import { PlusIcon, Loader2Icon } from 'lucide-react';

interface CreateClassDialogProps {
  onClassCreated: (newClass: Class) => void;
}

export function CreateClassDialog({ onClassCreated }: CreateClassDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (
    values: CreateClassRequest,
    { setSubmitting, resetForm }: FormikHelpers<CreateClassRequest>
  ) => {
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create class');
      }

      const newClass = await response.json();
      
      // Success - close dialog and reset form
      toast.success('Class created successfully!', {
        description: `Invitation code: ${newClass.invitationCode}`
      });
      
      resetForm();
      setIsOpen(false);
      
      // Notify parent component about the new class
      onClassCreated(newClass);
    } catch (error) {
      toast.error('Failed to create class', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Class
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogDescription>
            Enter the details to create a new class. Students will be able to join using the invitation code.
          </DialogDescription>
        </DialogHeader>
        
        <Formik
          initialValues={createClassInitialValues}
          validationSchema={createClassSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Class Name
                </Label>
                <Field
                  as={Input}
                  id="name"
                  name="name"
                  placeholder="Enter class name..."
                  className={errors.name && touched.name ? 'border-destructive' : ''}
                />
                {errors.name && touched.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
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
                    'Create Class'
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