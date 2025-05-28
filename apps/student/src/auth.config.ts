import { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@intellect-kanban/utils";

// Define response types explicitly to avoid type errors
interface User {
  email: string;
  name: string;
  role: string;
}

interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

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
          // Use our secure API route instead of calling backend directly
          const response = await fetch(`${process.env.NEXT_PUBLIC_STUDENT_APP_URL}/api/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              // No need to specify role here as it's hardcoded in the API route
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('Authentication error:', error);
            return null;
          }

          const data = await response.json() as AuthResponse;
          const { success, token, user } = data;

          if (!success || !token || !user) return null;

          // Return the user object and include the token in it
          return {
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
        session.user.role = token.role as string;
        session.user.accessToken = token.accessToken as string;
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