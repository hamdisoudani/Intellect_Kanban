"use client";

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Separator
} from '@intellect-kanban/ui';
import { Class } from '@/utils/types';
import { TrashIcon, ClipboardCopyIcon, CheckIcon, LinkIcon, AlertTriangleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface ClassInfoTabProps {
  classData: Class;
  onDeleteClass?: () => Promise<void>;
  hideDangerZone?: boolean;
}

export function ClassInfoTab({ classData, onDeleteClass, hideDangerZone = false }: ClassInfoTabProps) {
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const formattedDate = classData.createdAt ? 
    format(new Date(classData.createdAt), 'MMMM d, yyyy') : 
    'Unknown date';

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(classData.invitationCode);
    setIsCopied(true);
    toast.success('Invitation code copied to clipboard');
    
    // Reset the copy icon after 2 seconds
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/join?code=${classData.invitationCode}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invitation link copied to clipboard');
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Class Information & Invitation */}
      <div>
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg">Class Information</CardTitle>
          <CardDescription>
            View and manage class details and invitation settings
          </CardDescription>
        </CardHeader>
        
        <div className="space-y-6">
          {/* Class Basic Information */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Class Name</p>
              <p className="text-base sm:text-lg">{classData.name}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Created On</p>
              <p className="text-sm sm:text-base">{formattedDate}</p>
            </div>
          </div>
          
          <Separator />
          
          {/* Invitation Section */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Invitation Code</p>
              <p className="text-xs text-muted-foreground mb-2">
                Share this code with students to join your class
              </p>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-3 py-1.5 rounded text-sm sm:text-base font-mono flex-1 truncate">
                  {showInviteCode ? classData.invitationCode : '••••••••'}
                </code>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowInviteCode(!showInviteCode)}
                >
                  {showInviteCode ? 'Hide' : 'Show'}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleCopyInviteCode}
                >
                  {isCopied ? <CheckIcon size={16} /> : <ClipboardCopyIcon size={16} />}
                </Button>
              </div>
            </div>
            
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleCopyInviteLink}
              className="w-full group"
            >
              <LinkIcon size={16} className="mr-2 group-hover:animate-pulse" />
              Copy Invitation Link
            </Button>
          </div>
        </div>
      </div>
      
      {/* Danger Zone - only show if not hidden */}
      {!hideDangerZone && onDeleteClass && (
        <motion.div 
          variants={cardVariants} 
          initial="hidden" 
          animate="visible"
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangleIcon size={18} className="text-destructive" />
            <h3 className="text-base font-medium text-destructive">Danger Zone</h3>
          </div>
          
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-medium">Delete Class</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This action cannot be undone. All boards, activities, and student assignments will be permanently deleted.
                  </p>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="whitespace-nowrap transition-all w-full sm:w-auto"
                    >
                      <TrashIcon size={16} className="mr-2" />
                      Delete Class
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the 
                        class "{classData.name}" and all of its data, including boards, 
                        activities, and student assignments.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDeleteClass}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
} 