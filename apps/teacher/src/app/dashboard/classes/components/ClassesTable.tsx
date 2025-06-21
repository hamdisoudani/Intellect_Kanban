"use client";

import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, StatusBadge, Button, Card } from '@intellect-kanban/ui';
import { Class } from '@/utils/types';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Calendar, Users, ExternalLink, School } from 'lucide-react';
import { motion } from 'framer-motion';

interface ClassesTableProps {
  classes: Class[];
  isLoading?: boolean;
}

export function ClassesTable({ classes, isLoading = false }: ClassesTableProps) {
  const router = useRouter();
  
  // Keep track of which invitation codes are visible
  const [visibleCodes, setVisibleCodes] = useState<Record<string, boolean>>({});

  const toggleCodeVisibility = (classId: string) => {
    setVisibleCodes(prev => ({
      ...prev,
      [classId]: !prev[classId]
    }));
  };

  const handleManageClass = (classId: string) => {
    router.push(`/dashboard/classes/${classId}`);
  };

  const columns = useMemo<ColumnDef<Class>[]>(() => [
    {
      id: "name",
      accessorKey: "name",
      header: "Class Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 py-2">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">
              {row.original.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="font-medium truncate max-w-[180px]" title={row.original.name}>
            {row.original.name}
          </div>
        </div>
      )
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      size: 120,
      cell: () => <StatusBadge status="active" className="px-3" />
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: "Created Date",
      size: 160,
      enableHiding: true,
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar size={15} className="flex-shrink-0" />
            <span>{date.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short', 
              day: 'numeric'
            })}</span>
          </div>
        );
      },
    },
    {
      id: "joinedUsers",
      accessorKey: "joinedUsers",
      header: "Students",
      size: 150,
      enableHiding: true,
      cell: ({ row }) => {
        const studentCount = row.original.joinedUsers.length;
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-full w-fit">
            <Users size={14} className="flex-shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium">{studentCount} student{studentCount !== 1 ? 's' : ''}</span>
          </div>
        );
      },
    },
    {
      id: "invitationCode",
      accessorKey: "invitationCode",
      header: "Invitation Code",
      cell: ({ row }) => {
        const isVisible = visibleCodes[row.original._id] || false;
        const code = row.original.invitationCode;
        
        return (
          <div className="flex items-center gap-2 p-1.5 px-3 bg-muted/20 rounded-md w-full sm:w-[200px]">
            <code className="text-sm font-mono flex-1 truncate" style={{ filter: isVisible ? 'none' : 'blur(4px)' }}>
              {code}
            </code>
            <button 
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleCodeVisibility(row.original._id);
              }}
              aria-label={isVisible ? "Hide invitation code" : "Show invitation code"}
            >
              {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      size: 120,
      cell: ({ row }) => {
        return (
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1 w-[100px]"
            onClick={() => handleManageClass(row.original._id)}
          >
            <span>Manage</span>
            <ExternalLink size={14} className="ml-1 flex-shrink-0" />
          </Button>
        );
      },
    },
  ], [visibleCodes]);

  // Loading state
  if (isLoading) {
    return (
      <Card className="border-border/40 shadow-sm overflow-hidden">
        <div className="flex items-center justify-center h-64 bg-muted/5">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-t-primary/80 rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground">Loading classes...</p>
          </div>
        </div>
      </Card>
    );
  }

  // Empty state
  if (classes.length === 0) {
    return (
      <motion.div 
        className="text-center p-12 border rounded-lg bg-muted/5 border-border/40 border-dashed shadow-sm"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <School className="text-primary h-7 w-7" />
        </div>
        <h3 className="text-xl font-medium mb-2">No classes yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Create your first class to start organizing your teaching materials and assignments
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/40 shadow-sm overflow-hidden rounded-xl">
        <div className="p-2 sm:p-3 md:p-4 w-full overflow-auto">
          <DataTable 
            columns={columns} 
            data={classes}
            searchKey="name"
            searchPlaceholder="Search..."
            className="overflow-hidden"
            showColumnToggle={true}
            defaultPageSize={10}
            pageSizeOptions={[5, 10, 15, 20]}
          />
        </div>
      </Card>
    </motion.div>
  );
} 