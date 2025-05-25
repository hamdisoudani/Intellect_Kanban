import { auth } from '@/auth';
import { apiClient } from '@intellect-kanban/utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler to fetch assignments for a specific board
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
    
    // Call the backend API to fetch assignments for the board
    // This should be adapted based on your backend API structure
    const response = await apiClient.get(`/assignments/board/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Return the data from the API response
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Failed to fetch board assignments:', error);
    
    // Handle specific error responses from the backend
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to fetch board assignments';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch board assignments' },
      { status: 500 }
    );
  }
} 