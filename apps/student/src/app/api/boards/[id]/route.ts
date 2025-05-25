import { auth } from '@/auth';
import { apiClient } from '@intellect-kanban/utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler to fetch a specific board by ID
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
    
    // Call the backend API to fetch the board details
    const response = await apiClient.get(`/boards/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Return the data from the API response
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Failed to fetch board details:', error);
    
    // Handle specific error responses from the backend
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to fetch board details';
      
      if (status === 404) {
        return NextResponse.json(
          { error: 'Board not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch board details' },
      { status: 500 }
    );
  }
} 