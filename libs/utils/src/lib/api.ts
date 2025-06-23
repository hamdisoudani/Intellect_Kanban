import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { signOut } from 'next-auth/react';

/**
 * Constants for API configuration
 */
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_DELAY: 1000, // 1 second
  MAX_RETRIES: 3
};

/**
 * Custom axios instance with predefined configuration
 */
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Flag to prevent multiple sign-out calls in case of cascading API failures
let isSigningOut = false;

/**
 * Triggers a user sign-out and redirects to the home page.
 * This is called when a 401 response indicates an invalid or expired token.
 */
const handleUnauthorizedAccess = () => {
  if (!isSigningOut) {
    isSigningOut = true;
    
    // Use a timeout to delay the sign-out slightly,
    // allowing any concurrent requests to complete and preventing race conditions.
    setTimeout(() => {
      signOut({ callbackUrl: '/' });
      // After sign-out is initiated, reset the flag.
      // The page will be redirected, so the state will be fresh.
      isSigningOut = false; 
    }, 500);
  }
};

/**
 * Request interceptor
 * - Handle any pre-request logic
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Auth will be handled by Next Auth later
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * - Handle common API responses
 * - Process errors in a unified way
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    console.log("Worked outside the check if it's 401")
    // Check for a 401 Unauthorized response
    if (error.response?.status === 401) {
      console.log("Worked")
      // Check for a specific error message indicating an expired/invalid token.
      // This message should be sent consistently from the backend.
      const errorMessage = (error.response.data as { message?: string })?.message;
      if (errorMessage === 'Invalid or expired token') {
        handleUnauthorizedAccess();
        
        // We still reject the promise to let the calling code know the request failed.
        // The UI will be redirected shortly.
        return Promise.reject(error);
      }
    }
    
    // Handle network errors with retries
    if (error.message === 'Network Error' && !originalRequest._retry) {
      originalRequest._retry = true;
      let retries = 0;
      
      const retry = async (): Promise<AxiosResponse> => {
        try {
          await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
          return await axios(originalRequest);
        } catch (e) {
          if (retries < API_CONFIG.MAX_RETRIES) {
            retries++;
            return retry();
          }
          throw e;
        }
      };
      
      return retry();
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

/**
 * Helper functions for common API operations
 */
export const apiHelpers = {
  /**
   * Handle API errors in a consistent way
   */
  handleError: (error: unknown): { message: string; status?: number } => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      let message = error.response?.data?.message || error.message;
      
      // Custom error messages based on status codes
      if (status === 404) {
        message = 'Resource not found';
      } else if (status === 403) {
        message = 'You do not have permission to access this resource';
      } else if (status === 500) {
        message = 'Server error, please try again later';
      } else if (!message) {
        message = 'An unexpected error occurred';
      }
      
      return { message, status };
    }
    
    return { message: 'An unexpected error occurred' };
  }
}; 