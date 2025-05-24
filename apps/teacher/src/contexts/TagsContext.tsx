import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Tag, CreateTagDto } from '@/types/tags';
import { toast } from 'sonner';

interface TagsContextType {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  fetchTags: () => Promise<Tag[]>;
  createTag: (tagData: CreateTagDto) => Promise<Tag | null>;
  createTags: (tagsData: CreateTagDto[]) => Promise<Tag[]>;
  addTag: (tag: Tag) => void;
}

const TagsContext = createContext<TagsContextType | undefined>(undefined);

interface TagsProviderProps {
  children: ReactNode;
  boardId?: string;
}

export function TagsProvider({ children, boardId }: TagsProviderProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all tags
  const fetchTags = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/tags');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tags');
      }
      
      const data = await response.json();
      setTags(data);
      return data;
    } catch (err) {
      console.error('Error fetching tags:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tags';
      setError(errorMessage);
      toast.error('Error', {
        description: errorMessage,
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new tag
  const createTag = useCallback(async (tagData: CreateTagDto): Promise<Tag | null> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tagData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create tag');
      }
      
      const newTag = await response.json();
      
      // Update local state with the new tag
      setTags(prevTags => [...prevTags, newTag]);
      
      toast.success('Tag created');
      return newTag;
    } catch (err) {
      console.error('Error creating tag:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tag';
      toast.error('Error', {
        description: errorMessage,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create multiple tags at once
  const createTags = useCallback(async (tagsData: CreateTagDto[]): Promise<Tag[]> => {
    if (!tagsData.length) return [];
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/tags/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tagsData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create tags');
      }
      
      const newTags = await response.json();
      
      // Update local state with the new tags
      setTags(prevTags => [...prevTags, ...newTags]);
      
      toast.success(`${newTags.length} tags created`);
      return newTags;
    } catch (err) {
      console.error('Error creating tags:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tags';
      toast.error('Error', {
        description: errorMessage,
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a tag to the local state (useful when creating a tag in a nested component)
  const addTag = (tag: Tag) => {
    setTags(prevTags => {
      // Check if tag already exists
      const exists = prevTags.some(t => t._id === tag._id);
      if (exists) return prevTags;
      return [...prevTags, tag];
    });
  };

  // Fetch tags on mount if boardId is provided
  useEffect(() => {
    if (boardId) {
      fetchTags();
    }
  }, [boardId, fetchTags]);

  const value = {
    tags,
    isLoading,
    error,
    fetchTags,
    createTag,
    createTags,
    addTag
  };

  return (
    <TagsContext.Provider value={value}>
      {children}
    </TagsContext.Provider>
  );
}

export function useTags() {
  const context = useContext(TagsContext);
  if (context === undefined) {
    throw new Error('useTags must be used within a TagsProvider');
  }
  return context;
} 