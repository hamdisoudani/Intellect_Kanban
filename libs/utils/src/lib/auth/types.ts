/**
 * Auth response type from the backend
 */
export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    email: string;
    name: string;
    role: string;
  }
} 