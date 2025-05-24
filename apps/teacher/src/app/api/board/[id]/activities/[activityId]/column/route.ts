import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apiClient } from '@intellect-kanban/utils';

// PATCH: Update an activity's column
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; activityId: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = session.user.accessToken;
    const { columnId } = await req.json();
    
    if (!columnId) {
      return NextResponse.json(
        { error: 'Column ID is required' }, 
        { status: 400 }
      );
    }
    
    // Await params before accessing its properties
    const { activityId } = await params;
    
    // Call the backend API to update the activity's column
    const response = await apiClient.patch(
      `/activities/${activityId}/column`,
      { columnId },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Failed to update activity column:', error);
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to update activity column';
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json(
      { error: 'Failed to update activity column' }, 
      { status: 500 }
    );
  }
} 