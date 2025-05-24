'use server';

import { auth, signIn, signOut } from "../auth";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

/**
 * Server action to handle login
 * This addresses the "headers was called outside a request scope" error
 * by moving authentication to the server context where headers are available
 */
export async function login(
  email: string,
  password: string,
  redirectTo: string = "/dashboard"
) {
  try {
    // The signIn function will redirect on success
    return await signIn('credentials', {
      email,
      password,
      redirectTo,
    });
  } catch (error) {
    // Check if this is a redirect error (successful login)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      // This is actually a successful redirect, not an error
      // Let it propagate up to be handled by Next.js
      throw error;
    }
    
    // Handle actual authentication errors
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials" };
        default:
          return { error: "Something went wrong" };
      }
    }
    
    // If we get here, something unexpected happened
    console.error('Login error:', error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Server action to handle logout
 */
export async function logout() {
  await signOut({ redirectTo: "/" });
}

/**
 * Server action to get the current session
 */
export async function getSession() {
  const session = await auth();
  return session;
}

/**
 * Server action to check authentication
 * Redirects to login if not authenticated
 */
export async function requireAuth() {
  const session = await auth();
  
  if (!session) {
    redirect("/");
  }
  
  return session;
} 