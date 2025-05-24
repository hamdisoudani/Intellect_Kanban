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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@intellect-kanban/ui';
import { Class } from '@/utils/types';
import { TrashIcon, ClipboardCopyIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon, LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ClassInfoTabProps {
  classData: Class;
  onDeleteClass: () => Promise<void>;
}

export function ClassInfoTab({ classData, onDeleteClass }: ClassInfoTabProps) {
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDangerOpen, setIsDangerOpen] = useState(false);
  
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Class Information</CardTitle>
            <CardDescription>
              View basic information about this class
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Class Name</p>
              <p className="text-lg">{classData.name}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Created On</p>
              <p>{formattedDate}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Invitation</CardTitle>
            <CardDescription>
              Share this with students to join your class
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Class Code</p>
              <div className="flex items-center space-x-2">
                <code className="bg-muted px-3 py-1.5 rounded text-base font-mono flex-1 truncate">
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
                  size="sm"
                  onClick={handleCopyInviteCode}
                >
                  {isCopied ? <CheckIcon size={16} /> : <ClipboardCopyIcon size={16} />}
                </Button>
              </div>
            </div>
            
            <div>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handleCopyInviteLink}
                className="w-full"
              >
                <LinkIcon size={16} className="mr-2" />
                Copy Invitation Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Collapsible 
        open={isDangerOpen} 
        onOpenChange={setIsDangerOpen}
        className="border rounded-lg overflow-hidden"
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 bg-destructive/10 cursor-pointer hover:bg-destructive/15 transition-colors">
            <div className="flex items-center">
              <TrashIcon size={16} className="mr-2 text-destructive" />
              <h3 className="font-medium text-destructive">Danger Zone</h3>
            </div>
            <div>
              {isDangerOpen ? 
                <ChevronUpIcon size={16} className="text-destructive" /> : 
                <ChevronDownIcon size={16} className="text-destructive" />
              }
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 border-t">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-medium">Delete Class</p>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. All boards, activities, and assignments will be permanently deleted.
                </p>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="whitespace-nowrap">
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
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
} 