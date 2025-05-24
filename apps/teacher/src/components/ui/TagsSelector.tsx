"use client";

import { useState, useMemo, useCallback, Fragment } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  Input,
  Separator,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@intellect-kanban/ui';
import { Plus, Search, Tag as TagIcon, X, Check } from 'lucide-react';
import { Tag } from './Tag';
import { cn } from '@intellect-kanban/utils';
import { Tag as TagType, CreateTagDto } from '@/types/tags';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AnimatePresence, motion } from 'framer-motion';

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

interface TagsSelectorProps {
  availableTags: TagType[];
  selectedTags: TagType[];
  onChange: (tags: TagType[]) => void;
  onCreateTag?: (tag: CreateTagDto) => Promise<TagType | null>;
  maxTags?: number;
  disabled?: boolean;
}

export function TagsSelector({
  availableTags,
  selectedTags,
  onChange,
  onCreateTag,
  maxTags = 5,
  disabled = false
}: TagsSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Create form
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: '',
      description: '',
      color: PREDEFINED_COLORS[0]
    }
  });
  
  // Filter available tags based on search and already selected
  const filteredTags = useMemo(() => {
    const selectedIds = selectedTags.map(tag => tag._id);
    
    return availableTags
      .filter(tag => !selectedIds.includes(tag._id))
      .filter(tag => 
        tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tag.description && tag.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [availableTags, selectedTags, searchTerm]);
  
  // Handle tag selection
  const handleSelectTag = useCallback((tag: TagType) => {
    if (selectedTags.length >= maxTags) {
      toast.error(`Maximum ${maxTags} tags allowed`);
      return;
    }
    
    onChange([...selectedTags, tag]);
  }, [selectedTags, onChange, maxTags]);
  
  // Handle tag removal
  const handleRemoveTag = useCallback((tagId: string) => {
    onChange(selectedTags.filter(tag => tag._id !== tagId));
  }, [selectedTags, onChange]);
  
  // Handle creating a new tag
  const handleCreateTag = useCallback(async (values: TagFormValues) => {
    if (!onCreateTag) return;
    
    try {
      const newTag = await onCreateTag({
        name: values.name,
        description: values.description || undefined,
        color: values.color
      });
      
      if (newTag) {
        // Close create dialog
        setCreateDialogOpen(false);
        
        // Reset form
        form.reset();
        
        // Select the new tag
        if (selectedTags.length < maxTags) {
          onChange([...selectedTags, newTag]);
        }
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  }, [onCreateTag, selectedTags, onChange, maxTags, form]);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">
          Tags <span className="text-muted-foreground">({selectedTags.length}/{maxTags})</span>
        </Label>
      </div>
      
      <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
        <AnimatePresence>
          {selectedTags.map(tag => (
            <Tag
              key={tag._id}
              label={tag.name}
              color={tag.color}
              onRemove={() => handleRemoveTag(tag._id)}
            />
          ))}
        </AnimatePresence>
        
        {selectedTags.length < maxTags && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "gap-1 h-8 border-dashed border-gray-300 hover:border-gray-400 transition-colors",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                disabled={disabled}
              >
                <Plus size={16} />
                Add Tag
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-0" align="start" sideOffset={5}>
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tags..."
                    className="pl-8 h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="max-h-52 overflow-y-auto">
                {filteredTags.length > 0 ? (
                  <div className="py-1">
                    {filteredTags.map(tag => (
                      <button
                        key={tag._id}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-left"
                        onClick={() => {
                          handleSelectTag(tag);
                          setOpen(false);
                        }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm">{tag.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    {searchTerm ? 'No matching tags found' : 'No available tags'}
                  </div>
                )}
              </div>
              
              {onCreateTag && (
                <Fragment>
                  <Separator />
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-accent text-left"
                    onClick={() => {
                      setCreateDialogOpen(true);
                      setOpen(false);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">Create new tag</span>
                  </button>
                </Fragment>
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      {/* Create Tag Dialog */}
      {onCreateTag && (
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TagIcon className="h-5 w-5" />
                Create New Tag
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateTag)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter tag name" {...field} />
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
                        <Input placeholder="Enter tag description" {...field} />
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
                              field.value === color && "ring-2 ring-offset-2 ring-primary"
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
                            className="w-24 h-8"
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
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Tag</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 