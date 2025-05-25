"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect if a media query matches the current window size
 * @param query CSS media query string (e.g. '(max-width: 768px)')
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with a default value to avoid hydration issues
  const [matches, setMatches] = useState(false);
  
  // Set up media query listener
  useEffect(() => {
    // Check if window exists (client-side)
    if (typeof window === 'undefined') return;
    
    // Create media query list
    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);
    
    // Define listener function
    const handleChange = (event: { matches: boolean }) => {
      setMatches(event.matches);
    };
    
    // Add listener - use the appropriate method based on browser support
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // For older browsers
      mediaQuery.addListener(handleChange);
    }
    
    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // For older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);
  
  return matches;
} 