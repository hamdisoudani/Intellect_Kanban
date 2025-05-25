// Re-export the utils
export { cn } from './lib/utils';

// Re-export validation schemas
export { 
  loginInitialValues, 
  loginSchema,
  signupInitialValues,
  signupSchema 
} from './lib/validation/auth';

// Export API client
export { default as apiClient, apiHelpers, API_CONFIG } from './lib/api';

// Export auth types only
export type { AuthResponse } from './lib/auth';

export { useIsMobile } from './hooks/use-mobile';
export { useMediaQuery } from './hooks/use-media-query';
