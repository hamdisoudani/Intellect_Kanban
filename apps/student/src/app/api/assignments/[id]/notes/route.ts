import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apiClient } from '@intellect-kanban/utils';

// PATCH: Update an assignment's notes
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
    const { notes } = await req.json();
    
    if (notes === undefined) {
      return NextResponse.json(
        { error: 'Notes content is required' }, 
        { status: 400 }
      );
    }
    
    // Await params before accessing its properties
    const { id: assignmentId } = await params;
    
    // Call the backend API to update the assignment's notes
    const response = await apiClient.patch(
      `/assignments/${assignmentId}`,
      { notes },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Failed to update assignment notes:', error);
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to update assignment notes';
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json(
      { error: 'Failed to update assignment notes' }, 
      { status: 500 }
    );
  }
} 