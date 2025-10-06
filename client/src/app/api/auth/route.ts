import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, action } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required',
        },
        { status: 400 }
      );
    }

    if (action === 'login') {
      // In a real app, this would validate against database
      // For demo purposes, accept any email/password
      const mockUser = {
        id: 'USR-001',
        email,
        role: 'patient',
        firstName: 'Demo',
        lastName: 'User',
      };

      return NextResponse.json({
        success: true,
        data: {
          user: mockUser,
          token: 'mock-jwt-token',
        },
        message: 'Login successful',
      });
    }

    if (action === 'register') {
      // In a real app, this would create user in database
      const { firstName, lastName, role } = body;

      if (!firstName || !lastName || !role) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required fields',
          },
          { status: 400 }
        );
      }

      const newUser = {
        id: `USR-${Date.now()}`,
        email,
        role,
        firstName,
        lastName,
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: {
          user: newUser,
          token: 'mock-jwt-token',
        },
        message: 'Registration successful',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action',
      },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication failed',
      },
      { status: 500 }
    );
  }
}

