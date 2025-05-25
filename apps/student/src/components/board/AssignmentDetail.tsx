"use client";

import { useState, useEffect } from 'react';
import { AssignmentWithMeta, Feedback } from '@/types';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
  ScrollArea,
  Separator,
  Card,
  Textarea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@intellect-kanban/ui';
import { 
  CalendarIcon,
  Clock,
  BarChart3,
  TagIcon,
  XIcon,
  FileIcon,
  Download,
  BookIcon,
  CircleIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  Save,
  MessageCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { formatMinutesToTime } from '@/utils/format';
import { markFeedbackAsRead, updateAssignmentNotes } from '@/utils/api';
import { toast } from 'sonner';

interface ColumnHistoryItem {
  columnId: string;
  enteredAt: string;
}

interface AssignmentDetailProps {
  assignment: AssignmentWithMeta;
  onClose: () => void;
}

export function AssignmentDetail({ assignment, onClose }: AssignmentDetailProps) {
  const [notes, setNotes] = useState(assignment.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [hasUnreadFeedback, setHasUnreadFeedback] = useState(false);
  const [feedback, setFeedback] = useState<Feedback[]>(assignment.feedback || []);

  // Check for unread feedback when component mounts
  useEffect(() => {
    if (assignment.feedback && assignment.feedback.length > 0) {
      setFeedback(assignment.feedback);
      const hasUnread = assignment.feedback.some((fb) => !fb.readByStudent);
      setHasUnreadFeedback(hasUnread);
      
      // If there's unread feedback, automatically switch to the feedback tab
      if (hasUnread) {
        setActiveTab('feedback');
        // Mark as read
        markFeedbackAsRead(assignment._id)
          .then((updatedAssignment) => {
            if (updatedAssignment.feedback) {
              setFeedback(updatedAssignment.feedback);
              setHasUnreadFeedback(false);
            }
          })
          .catch((error) => {
            console.error('Error marking feedback as read:', error);
          });
      }
    }
  }, [assignment]);

  // Format due date if it exists
  const formattedDueDate = assignment.dueDate 
    ? format(new Date(assignment.dueDate), 'MMMM d, yyyy')
    : null;
  
  const relativeDate = assignment.dueDate
    ? formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })
    : null;

  // Determine if the assignment is overdue
  const isOverdue = assignment.dueDate 
    ? new Date(assignment.dueDate) < new Date() 
    : false;
  
  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-amber-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-muted-foreground';
    }
  };

  // Get status details based on columnId
  const getStatusDetails = () => {
    switch (assignment.columnId) {
      case 'done':
        return {
          label: 'Completed',
          icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
          color: 'text-green-500'
        };
      case 'review':
        return {
          label: 'In Review',
          icon: <InfoIcon className="h-4 w-4 text-blue-500" />,
          color: 'text-blue-500'
        };
      case 'doing':
        return {
          label: 'In Progress',
          icon: <CircleIcon className="h-4 w-4 text-amber-500" />,
          color: 'text-amber-500'
        };
      default:
        return {
          label: isOverdue ? 'Overdue' : 'Not Started',
          icon: isOverdue 
            ? <AlertCircleIcon className="h-4 w-4 text-red-500" /> 
            : <CircleIcon className="h-4 w-4 text-gray-400" />,
          color: isOverdue ? 'text-red-500' : 'text-gray-400'
        };
    }
  };

  const status = getStatusDetails();

  // Column mapping for history
  const getColumnName = (columnId: string): string => {
    const columnNames: Record<string, string> = {
      'backlog': 'Backlog',
      'doing': 'In Progress',
      'review': 'Review',
      'done': 'Done'
    };
    
    return columnNames[columnId] || columnId;
  };
  
  // Handle saving notes
  const handleSaveNotes = async () => {
    if (notes === assignment.notes) return;
    
    setIsSaving(true);
    try {
      await updateAssignmentNotes(assignment._id, notes);
      toast.success('Notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1 pr-10">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                {assignment.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                {assignment.priority && (
                  <Badge 
                    variant="outline" 
                    className={`${getPriorityColor(assignment.priority)} border-current`}
                  >
                    {assignment.priority} priority
                  </Badge>
                )}
                <Badge 
                  variant="outline" 
                  className={`${status.color} border-current flex items-center gap-1`}
                >
                  {status.icon}
                  <span>{status.label}</span>
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Tags */}
          {assignment.tags && assignment.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {assignment.tags.map((tag) => (
                <Badge 
                  key={tag.id} 
                  style={{ 
                    backgroundColor: `${tag.color}20`, 
                    color: tag.color, 
                    borderColor: `${tag.color}40`
                  }}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>
          )}
        </DialogHeader>
        
        <Separator className="my-0" />
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="mx-6 mt-4"
        >
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="notes">My Notes</TabsTrigger>
            <TabsTrigger value="feedback" className="relative">
              Feedback
              {hasUnreadFeedback && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
              )}
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="max-h-[calc(90vh-12rem)] mt-4">
            <TabsContent value="description" className="space-y-6">
              {/* Metadata/statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/20 rounded-md p-4">
                {/* Due date */}
                {formattedDueDate && (
                  <div className="flex items-start">
                    <div className="bg-background rounded-md p-2 mr-3">
                      <CalendarIcon className={`h-4 w-4 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className={`text-sm font-medium ${isOverdue ? 'text-red-500' : ''}`}>
                        {formattedDueDate}
                      </p>
                      {relativeDate && (
                        <p className={`text-xs ${isOverdue ? 'text-red-500/80' : 'text-muted-foreground'}`}>
                          {relativeDate}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Estimated time */}
                {assignment.estimatedTimeMinutes && (
                  <div className="flex items-start">
                    <div className="bg-background rounded-md p-2 mr-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Estimated Time</p>
                      <p className="text-sm font-medium">
                        {formatMinutesToTime(assignment.estimatedTimeMinutes)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Difficulty */}
                {assignment.difficultyLevel && (
                  <div className="flex items-start">
                    <div className="bg-background rounded-md p-2 mr-3">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Difficulty</p>
                      <p className="text-sm font-medium">
                        {assignment.difficultyLevel}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {assignment.description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Attachments */}
              {assignment.attachments && assignment.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Attachments</h3>
                  <div className="space-y-2">
                    {assignment.attachments.map((attachment, i) => (
                      <div key={attachment.id || i} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{attachment.name || `Attachment ${i+1}`}</span>
                        </div>
                        <Button size="sm" variant="outline" className="h-8">
                          <Download className="h-3 w-3 mr-1" /> Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="notes" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">My Notes</h3>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your notes here..."
                  className="min-h-[200px]"
                />
                <div className="flex justify-end mt-2">
                  <Button 
                    size="sm" 
                    onClick={handleSaveNotes} 
                    disabled={isSaving || notes === assignment.notes}
                  >
                    {isSaving ? (
                      <>
                        <span className="animate-spin mr-2">◌</span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5 mr-1.5" /> Save Notes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="mt-2">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Teacher Feedback</h3>
                
                {feedback && feedback.length > 0 ? (
                  feedback.map((item, index) => (
                    <Card key={item._id || index} className="p-3">
                      <div className="flex justify-between">
                        <div className="text-xs text-muted-foreground mb-1">
                          <span className="font-medium text-foreground">
                            {item.createdBy?.name || 'Teacher'}
                          </span>
                          <span> · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-line">{item.content}</p>
                    </Card>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <MessageCircle className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No feedback yet.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 