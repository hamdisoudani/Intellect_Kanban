import { auth } from '@/auth';
import { apiClient } from '@intellect-kanban/utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler to fetch a specific class by ID
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
    
    // Call the backend API to fetch the class details
    const response = await apiClient.get(`/classes/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Return the data from the API response
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Failed to fetch class details:', error);
    
    // Handle specific error responses from the backend
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to fetch class details';
      
      if (status === 404) {
        return NextResponse.json(
          { error: 'Class not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch class details' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler to remove a class
 */
export async function DELETE(
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
    
    // Call the backend API to delete the class
    await apiClient.delete(`/classes/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Return success response
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to delete class:', error);
    
    // Handle specific error responses from the backend
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to delete class';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete class' },
      { status: 500 }
    );
  }
} 