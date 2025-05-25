import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apiClient } from '@intellect-kanban/utils';

// PATCH: Mark assignment feedback as read
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = session.user.accessToken;
    
    // Await params before accessing its properties
    const { id: assignmentId } = await params;
    
    // Call the backend API to mark feedback as read
    const response = await apiClient.patch(
      `/assignments/${assignmentId}/feedback/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Failed to mark feedback as read:', error);
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to mark feedback as read';
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json(
      { error: 'Failed to mark feedback as read' }, 
      { status: 500 }
    );
  }
} 