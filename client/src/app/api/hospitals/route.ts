import { NextRequest, NextResponse } from 'next/server';
import hospitalsData from '@/data/hospitals.json';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hospitalId = searchParams.get('id');
    const planId = searchParams.get('planId');

    if (hospitalId) {
      const hospital = hospitalsData.find(h => h.id === hospitalId);
      if (!hospital) {
        return NextResponse.json(
          {
            success: false,
            error: 'Hospital not found',
          },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: hospital,
      });
    }

    let filteredHospitals = hospitalsData;

    // Filter by accepted plans
    if (planId) {
      filteredHospitals = filteredHospitals.filter(h => 
        h.acceptedPlans.includes(planId)
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredHospitals,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch hospitals',
      },
      { status: 500 }
    );
  }
}

