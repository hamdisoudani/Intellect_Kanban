import { auth } from '@/auth';
import { apiClient } from '@intellect-kanban/utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler to fetch boards for a specific class
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Await params before accessing its properties
    const { id } = await params;
    
    // Call the backend API to fetch boards for the class
    const response = await apiClient.get(`/boards/class/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Return the data from the API response
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Failed to fetch class boards:', error);
    
    // Handle specific error responses from the backend
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to fetch class boards';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch class boards' },
      { status: 500 }
    );
  }
} 