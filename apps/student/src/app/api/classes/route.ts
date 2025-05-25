import { auth } from '@/auth';
import { apiClient } from '@intellect-kanban/utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler to fetch classes joined by the authenticated student
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
    
    // Call the backend API to fetch student's joined classes
    const response = await apiClient.get('/classes/my-joined', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Return the data from the API response
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

/**
 * POST handler to join a class using invitation code
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
    
    // Get the invitation code from the request body
    const { invitationCode } = await req.json();
    
    // Validate the invitation code
    if (!invitationCode) {
      return NextResponse.json(
        { error: 'Invitation code is required' },
        { status: 400 }
      );
    }
    
    // Call the backend API to join a class
    const response = await apiClient.post('/classes/join', { invitationCode }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Return the data from the API response
    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error('Failed to join class:', error);
    
    // Handle specific error responses from the backend
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to join class';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to join class' },
      { status: 500 }
    );
  }
} 