import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extend the built-in session types
   */
  interface Session extends DefaultSession {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      accessToken?: string;
    };
  }

  /**
   * Extend the built-in user types
   */
  interface User {
    role?: string;
    accessToken?: string;
  }
}

/**
 * Extend the JWT interface with custom properties
 */
declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    accessToken?: string;
  }
} 