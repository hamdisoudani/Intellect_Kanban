import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apiClient } from '@intellect-kanban/utils';

/**
 * GET handler to fetch tags created by the authenticated teacher
 */
export async function GET(req: NextRequest) {
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
    
    // Call the backend API to fetch teacher's tags
    const response = await apiClient.get('/tags', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Return the data from the API response
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Failed to fetch tags:', error);
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to fetch tags';
      return NextResponse.json({ error: message }, { status });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

/**
 * POST handler to create a new tag
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
    const tagData = await req.json();
    
    const response = await apiClient.post('/tags', tagData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return NextResponse.json(response.data, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create tag:', error);
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to create tag';
      return NextResponse.json({ error: message }, { status });
    }
    
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
} 