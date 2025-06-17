import { auth } from '@/auth';
import { apiClient } from '@intellect-kanban/utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler to fetch analytics data for the teacher dashboard
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
    
    // Call the backend API to fetch analytics data
    const response = await apiClient.get('/analytics/teacher-dashboard', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Return the data from the API response
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Failed to fetch analytics data:', error);
    
    // Handle specific error responses from the backend
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Failed to fetch analytics data';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
} 