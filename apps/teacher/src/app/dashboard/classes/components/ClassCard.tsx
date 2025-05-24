"use client";

import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  Button,
  StatusBadge
} from '@intellect-kanban/ui';
import { Class } from '@/utils/types';
import { Users } from 'lucide-react';
import { useState } from 'react';

interface ClassCardProps {
  classData: Class;
  onManage: (classId: string) => void;
}

export function ClassCard({ classData, onManage }: ClassCardProps) {
  const [isInviteVisible, setIsInviteVisible] = useState(false);
  const studentCount = classData.joinedUsers.length;
  const formattedDate = new Date(classData.createdAt).toLocaleDateString();

  const toggleInviteCode = () => {
    setIsInviteVisible(prev => !prev);
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">{classData.name}</CardTitle>
        <p className="text-sm text-muted-foreground">Created on {formattedDate}</p>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span className="text-sm">{studentCount} student{studentCount !== 1 ? 's' : ''}</span>
          </div>
          <StatusBadge status="active">Active</StatusBadge>
        </div>
        
        <div className="mt-4">
          <p className="text-sm font-medium mb-1">Invitation Code:</p>
          <div className="flex items-center gap-2">
            {isInviteVisible ? (
              <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                {classData.invitationCode}
              </code>
            ) : (
              <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                ******
              </code>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleInviteCode}
            >
              {isInviteVisible ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-1 flex justify-end">
        <Button 
          onClick={() => onManage(classData._id)}
          variant="default"
          size="sm"
        >
          Manage Class
        </Button>
      </CardFooter>
    </Card>
  );
} 