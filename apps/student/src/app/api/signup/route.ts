import { NextRequest, NextResponse } from "next/server";
import { apiClient, apiHelpers } from "@intellect-kanban/utils";
import { auth } from "../../../auth";

export async function POST(request: NextRequest) {
  try {
    // First check if user is already logged in
    const session = await auth();
    if (session) {
      return NextResponse.json(
        { success: false, message: 'You are already logged in' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    // Call the backend signup API using apiClient
    try {
      const response = await apiClient.post('/auth/signup', {
        name,
        email,
        password,
        role: 'student'  // Hardcoded role for student app
      });

      // Return success response
      return NextResponse.json({ 
        success: true, 
        message: 'Account created successfully' 
      });
    } catch (error) {
      // Use the error handler from apiHelpers
      const { message, status } = apiHelpers.handleError(error);
      return NextResponse.json(
        { success: false, message },
        { status: status || 500 }
      );
    }
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred during signup' },
      { status: 500 }
    );
  }
} 