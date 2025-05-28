import { NextRequest, NextResponse } from "next/server";
import { apiClient, apiHelpers } from "@intellect-kanban/utils";

/**
 * Teacher login API route
 * This attaches the expected role on the server side for security
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Call the backend login API with teacher role verification
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
        expectedRole: 'teacher' // Hardcoded role for teacher app for security
      });

      return NextResponse.json(response.data);
    } catch (error) {
      // Use the error handler from apiHelpers
      const { message, status } = apiHelpers.handleError(error);
      
      // For security, always return the same generic error message
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: status || 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Invalid email or password' },
      { status: 401 }
    );
  }
} 