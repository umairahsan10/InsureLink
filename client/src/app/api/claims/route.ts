import { NextRequest, NextResponse } from 'next/server';
import claimsData from '@/data/claims.json';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');
    const corporateId = searchParams.get('corporateId');
    const hospitalId = searchParams.get('hospitalId');
    const status = searchParams.get('status');

    let filteredClaims = claimsData;

    if (employeeId) {
      filteredClaims = filteredClaims.filter(claim => claim.employeeId === employeeId);
    }

    if (corporateId) {
      filteredClaims = filteredClaims.filter(claim => claim.corporateId === corporateId);
    }

    if (hospitalId) {
      filteredClaims = filteredClaims.filter(claim => claim.hospitalId === hospitalId);
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
    if (!body.employeeId || !body.hospitalId || !body.amountClaimed) {
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
      id: `clm-${Date.now()}`,
      claimNumber: `CLM-2025-${Date.now().toString().slice(-4)}`,
      ...body,
      status: 'Submitted',
      approvedAmount: 0,
      documents: [],
      events: [
        {
          ts: new Date().toISOString(),
          actorName: body.employeeName || 'Employee',
          actorRole: 'Employee',
          action: 'Submitted claim',
          from: null,
          to: 'Submitted',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fraudRiskScore: 0,
      priority: 'Normal',
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
