/**
 * Interface for User data received from backend
 */
export interface User {
  _id: string;
  name: string;
  email?: string;
}

/**
 * Interface for Class data received from backend
 */
export interface Class {
  _id: string;
  name: string;
  invitationCode: string;
  createdBy: User;
  joinedUsers: User[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for API response when fetching classes
 */
export type ClassesResponse = Class[];

/**
 * Interface for creating a new class
 */
export interface CreateClassRequest {
  name: string;
} 