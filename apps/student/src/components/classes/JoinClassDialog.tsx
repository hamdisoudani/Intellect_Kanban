"use client";

import { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Input
} from '@intellect-kanban/ui';
import { PlusCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Class } from '@/types';
import { toast } from 'sonner';

// Define form schema using zod
const formSchema = z.object({
  invitationCode: z.string().length(6, {
    message: "Invitation code must be 6 characters"
  })
});

type FormValues = z.infer<typeof formSchema>;

interface JoinClassDialogProps {
  onClassJoined: (newClass: Class) => void;
}

export function JoinClassDialog({ onClassJoined }: JoinClassDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invitationCode: ''
    }
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join class');
      }
      
      // Call the onClassJoined callback with the new class data
      onClassJoined(data);
      
      // Show success message
      toast.success('Successfully joined the class!');
      
      // Reset form and close dialog
      form.reset();
      setIsOpen(false);
    } catch (error) {
      console.error('Error joining class:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join class');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    form.reset();
    setIsOpen(false);
  };

  return (
    <>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button onClick={() => setIsOpen(true)} className="gap-2">
          <PlusCircle size={16} />
          <span>Join Class</span>
        </Button>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join a Class</DialogTitle>
            <DialogDescription>
              Enter the invitation code provided by your teacher to join a class.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="invitationCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invitation Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter 6-digit code"
                        className="uppercase"
                        maxLength={6}
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join Class'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
} 