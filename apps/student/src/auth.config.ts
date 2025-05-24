import { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema, apiClient } from "@intellect-kanban/utils";
import type { AuthResponse } from "@intellect-kanban/utils";

// Type definitions are in ./types/auth.d.ts

/**
 * NextAuth configuration options for student app
 */
export const authConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        // Validate the credentials with Yup schema
        try {
          await loginSchema.validate({
            email: credentials.email,
            password: credentials.password,
          });
        } catch (error) {
          return null;
        }

        try {
          // Make API call to backend for authentication
          const response = await apiClient.post<AuthResponse>('/auth/login', {
            email: credentials.email,
            password: credentials.password,
          });

          const { success, token, user } = response.data;

          if (!success || !token || !user) return null;

          // Return the user object and include the token in it
          // NextAuth will automatically create a JWT from this
          return {
            // Backend doesn't provide ID directly, so we'll use empty string
            id: "", 
            email: user.email,
            name: user.name,
            role: user.role,
            accessToken: token
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // Include user info in the token
    jwt: async ({ token, user }) => {
      if (user) {
        // The user object is typed correctly via the module augmentation
        token.role = user.role;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    // Include user info in the session
    session: async ({ session, token }) => {
      if (token) {
        // The token values are now properly typed via the JWT interface extension
        session.user.role = token.role;
        session.user.accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",  // Use root page for login
    signOut: "/", // Redirect to home page after sign out
    error: "/",   // Error page
  },
  // Use JWT strategy since we're using a credential provider
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: "student-next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: "student-next-auth.callback-url",
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: "student-next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    }
  },
} satisfies NextAuthConfig; 