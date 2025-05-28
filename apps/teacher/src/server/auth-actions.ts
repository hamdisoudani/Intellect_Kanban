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
 * Server action to handle signup
 */
export async function signup(
  name: string,
  email: string,
  password: string
) {
  // Check if a session already exists, if yes, forbid signup
  const session = await auth();
  if (session) {
    return { error: "You are already logged in" };
  }

  try {
    // Use the API route instead of directly calling the backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_TEACHER_APP_URL}/api/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password
      }),
    });

    const data = await response.json();

    // If signup fails, return the error
    if (!response.ok) {
      return { 
        error: data.message || 'Failed to create account' 
      };
    }

    // Return success message that will be shown to the user
    return { success: true, message: 'Account created successfully! You can now login.' };
  } catch (error) {
    // Handle any errors
    console.error('Signup error:', error);
    return { error: "An unexpected error occurred during signup" };
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