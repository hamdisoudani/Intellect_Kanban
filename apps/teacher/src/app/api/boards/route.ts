import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apiClient } from '@intellect-kanban/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request data
    const data = await request.json();
    
    // Call backend API using apiClient
    const response = await apiClient.post('/boards', data, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`
      }
    });

    // Return the data from the API response
    return NextResponse.json(response.data, { status: 201 });

  } catch (error: any) {
    console.error('Error creating board:', error);
    
    // Handle specific error responses from the backend
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to create board';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
    
    return NextResponse.json(
      { error: 'An error occurred while creating the board' }, 
      { status: 500 }
    );
  }
} 