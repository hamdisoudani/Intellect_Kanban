import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

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