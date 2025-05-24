import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apiClient } from '@intellect-kanban/utils';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string, activityId: string } }
) {
  // Await params to fix Next.js warning
  const { activityId } = await Promise.resolve(params);
  
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = session.user.accessToken;
    
    const { studentIds } = await req.json();
    
    if (!studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json(
        { error: 'Student IDs must be provided as an array' },
        { status: 400 }
      );
    }
    
    // Call the backend API to assign students with auth token
    const response = await apiClient.post(
      `/activities/${activityId}/assign`,
      { studentIds },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error assigning students to activity:', error);
    
    // Extract the specific error message from the backend response if available
    let errorMessage = 'Failed to assign students';
    let statusCode = 500;
    
    if (error.response) {
      // Axios error with response from backend
      statusCode = error.response.status || 500;
      
      // Try to get the specific error message
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
    } else if (error.message) {
      // Regular Error object
      errorMessage = error.message;
    }
    
    // Return appropriate error response
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 