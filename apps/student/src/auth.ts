import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Type definitions are in ./types/auth.d.ts

/**
 * NextAuth configuration with exported methods
 * This file is specific to the student app
 */
export const { auth, handlers, signIn, signOut } = NextAuth({
  /**
   * Secret used to sign cookies and tokens
   * In production, use a strong secret from environment variable AUTH_SECRET
   */
  secret: process.env.AUTH_SECRET || "your-development-secret-do-not-use-in-production",
  
  /**
   * Configure session strategy, pages and other options
   * from authConfig
   */
  ...authConfig,
}) as {
  auth: (
    ...args: any[]
  ) => any;
  handlers: Record<string, any>;
  signIn: (...args: any[]) => any;
  signOut: (...args: any[]) => any;
};

// Re-export config to make it available
export { authConfig }; 