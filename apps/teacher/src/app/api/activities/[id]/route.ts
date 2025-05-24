import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apiClient } from '@intellect-kanban/utils';

/**
 * DELETE handler for deleting an activity
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = session.user.accessToken;
    const activityId = params.id;
    
    // Call backend API
    const response = await apiClient.delete(
      `/activities/${activityId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    return NextResponse.json(
      { message: 'Activity deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting activity:', error);
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to delete activity';
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 