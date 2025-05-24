import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * A utility function to conditionally join class names together
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function utils(): string {
  return 'utils';
}
