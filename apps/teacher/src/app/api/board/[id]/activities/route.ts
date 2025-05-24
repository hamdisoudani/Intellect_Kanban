import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apiClient } from '@intellect-kanban/utils';

// GET: Fetch activities for a board
export async function GET(
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
    const { id } = await params;
    
    const response = await apiClient.get(`/activities/board/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Failed to fetch activities:', error);
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to fetch activities';
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

// POST: Create a new activity for a board
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = session.user.accessToken;
    const data = await req.json();
    
    // Await params before accessing its properties
    const { id } = await params;
    
    // Always set boardId from params
    data.boardId = id;
    
    const response = await apiClient.post('/activities', data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return NextResponse.json(response.data, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create activity:', error);
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to create activity';
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
} 