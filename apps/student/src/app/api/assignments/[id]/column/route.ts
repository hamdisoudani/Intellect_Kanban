import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apiClient } from '@intellect-kanban/utils';

// PATCH: Update an assignment's column
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the session to check authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Extract the columnId and position from the request body
    const { columnId, position } = await request.json();
    
    if (!columnId) {
      return NextResponse.json(
        { message: 'Column ID is required' },
        { status: 400 }
      );
    }
    
    // Get the assignment ID from the URL params
    const assignmentId = params.id;
    
    console.log(`API Route: Updating assignment ${assignmentId} to column ${columnId}${position !== undefined ? ` at position ${position}` : ''}`);
    
    try {
      // Prepare request body - include position if provided
      const requestBody: { columnId: string; position?: number } = { columnId };
      if (position !== undefined) {
        requestBody.position = position;
      }
      
      // Make a simpler update just focused on changing the column and position if provided
      const response = await apiClient.patch(
        `/assignments/${assignmentId}`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${session.user.accessToken}`
          }
        }
      );
      
      console.log(`API Route: Update successful:`, response.data);
      
      // Return the updated assignment with columnId and position clearly included
      return NextResponse.json({
        ...response.data,
        columnId, // Ensure column ID is in the response
        position: position !== undefined ? position : response.data.position, // Include position if it was set
        _id: assignmentId
      });
    } catch (apiError: any) {
      console.error('API Route: Backend API error:', apiError.response?.data || apiError.message);
      if (apiError.response?.status === 404) {
        return NextResponse.json(
          { message: 'Assignment not found' },
          { status: 404 }
        );
      }
      throw apiError; // Re-throw to be caught by the outer catch block
    }
  } catch (error: any) {
    console.error('API Route: Error updating assignment column:', error);
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error || 'Failed to update assignment column';
      return NextResponse.json(
        { message },
        { status }
      );
    }
    
    return NextResponse.json(
      { message: 'Error updating assignment column' },
      { status: 500 }
    );
  }
} 