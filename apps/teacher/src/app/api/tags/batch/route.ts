import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apiClient } from '@intellect-kanban/utils';

/**
 * POST handler to create multiple tags at once
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in' },
        { status: 401 }
      );
    }
    
    const token = session.user.accessToken;
    const tagsData = await req.json();
    
    if (!Array.isArray(tagsData)) {
      return NextResponse.json(
        { error: 'Tags data must be an array' },
        { status: 400 }
      );
    }
    
    const response = await apiClient.post('/tags/batch', tagsData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return NextResponse.json(response.data, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create tags:', error);
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to create tags';
      return NextResponse.json({ error: message }, { status });
    }
    
    return NextResponse.json(
      { error: 'Failed to create tags' },
      { status: 500 }
    );
  }
} 