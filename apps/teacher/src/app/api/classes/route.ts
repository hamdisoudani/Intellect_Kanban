import { auth, signOut } from '@/auth';
import { logout } from '@/server/auth-actions';
import { apiClient } from '@intellect-kanban/utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler to fetch classes created by the authenticated teacher
 */
export async function GET(req: NextRequest) {
  try {
    // Get the session using NextAuth
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in' },
        { status: 401 }
      );
    }

    // Get the token from the session
    const token = session.user.accessToken;
    // Call the backend API to fetch teacher's classes
    const response = await apiClient.get('/classes/my-created', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Return the data from the API response
    return NextResponse.json(response.data);
  } catch (error: any) {
    // If the error is a Next.js redirect, re-throw it to let Next.js handle it
    if (error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    
    console.error('Failed to fetch classes:', error);
    
    // For other errors, return a generic 500 response
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

/**
 * POST handler to create a new class for the authenticated teacher
 */
export async function POST(req: NextRequest) {
  try {
    // Get the session using NextAuth
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in' },
        { status: 401 }
      );
    }

    // Get the token from the session
    const token = session.user.accessToken;
    
    // Get the class data from the request body
    const classData = await req.json();
    
    // Validate the class data
    if (!classData.name) {
      return NextResponse.json(
        { error: 'Class name is required' },
        { status: 400 }
      );
    }
    
    if (classData.name.length < 3 || classData.name.length > 50) {
      return NextResponse.json(
        { error: 'Class name must be between 3 and 50 characters' },
        { status: 400 }
      );
    }
    
    // Call the backend API to create a new class
    const response = await apiClient.post('/classes', classData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Return the data from the API response
    return NextResponse.json(response.data, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create class:', error);
    
    // Handle specific error responses from the backend
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to create class';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create class' },
      { status: 500 }
    );
  }
} 