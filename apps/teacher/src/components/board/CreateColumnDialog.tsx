"use client";

import { useState } from 'react';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { 
  Card,
  Button,
  Input,
  Label,
} from '@intellect-kanban/ui';
import { Loader2Icon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Column } from '@/utils/types';

interface CreateColumnDialogProps {
  boardId: string;
  onClose: () => void;
  onColumnCreated: (column: Column) => void;
  initialOrder: number;
}

const createColumnSchema = Yup.object({
  name: Yup.string()
    .required('Column name is required')
    .min(1, 'Column name must not be empty')
    .max(30, 'Column name must not exceed 30 characters'),
});

type FormValues = {
  name: string;
};

export function CreateColumnDialog({ 
  boardId, 
  onClose, 
  onColumnCreated,
  initialOrder
}: CreateColumnDialogProps) {
  const initialValues: FormValues = {
    name: '',
  };

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting }: FormikHelpers<FormValues>
  ) => {
    try {
      // Add order to the payload
      const payload = { 
        ...values, 
        boardId,
        order: initialOrder
      };

      const response = await fetch(`/api/board/${boardId}/columns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create column');
      }

      const newColumn = await response.json();
      
      // Success
      toast.success('Column created', {
        description: `Column "${newColumn.name}" added to board`
      });
      
      // Notify parent component
      onColumnCreated(newColumn);
      onClose();
    } catch (error) {
      toast.error('Failed to create column', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full p-4 h-min">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium">Add Column</h4>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={createColumnSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Column Name
              </Label>
              <Field
                as={Input}
                id="name"
                name="name"
                placeholder="Enter column name..."
                className={errors.name && touched.name ? 'border-destructive' : ''}
                autoFocus
              />
              {errors.name && touched.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Column'
                )}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Card>
  );
} 