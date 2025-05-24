import { auth } from '@/auth';
import { apiClient } from '@intellect-kanban/utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE handler to remove a user from a class
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
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
    
    // Call the backend API to remove the user from the class
    await apiClient.delete(`/classes/${params.id}/users/${params.userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Return success response
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to remove user from class:', error);
    
    // Handle specific error responses from the backend
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to remove user from class';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to remove user from class' },
      { status: 500 }
    );
  }
} 