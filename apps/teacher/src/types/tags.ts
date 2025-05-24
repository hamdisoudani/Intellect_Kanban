/**
 * Interface for a tag
 */
export interface Tag {
  _id: string;
  name: string;
  description?: string;
  color: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for creating a new tag
 */
export interface CreateTagDto {
  name: string;
  description?: string;
  color?: string;
}

/**
 * Interface for updating a tag
 */
export interface UpdateTagDto {
  name?: string;
  description?: string;
  color?: string;
}

/**
 * Interface for API response when fetching tags
 */
export type TagsResponse = Tag[]; 