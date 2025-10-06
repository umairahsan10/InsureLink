import { NextRequest, NextResponse } from 'next/server';
import claimsData from '@/data/claims.json';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let filteredClaims = claimsData;

    if (userId) {
      filteredClaims = filteredClaims.filter(claim => claim.patientId === userId);
    }

    if (status) {
      filteredClaims = filteredClaims.filter(claim => claim.status === status);
    }

    return NextResponse.json({
      success: true,
      data: filteredClaims,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch claims',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.patientId || !body.hospitalId || !body.amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // In a real app, this would save to database
    const newClaim = {
      id: `CLM-${Date.now()}`,
      ...body,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
    };

    return NextResponse.json({
      success: true,
      data: newClaim,
      message: 'Claim submitted successfully',
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit claim',
      },
      { status: 500 }
    );
  }
}

