import { NextRequest, NextResponse } from 'next/server';
import plansData from '@/data/plans.json';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const planId = searchParams.get('id');
    const corporateId = searchParams.get('corporateId');

    if (planId) {
      const plan = plansData.find(p => p.id === planId);
      if (!plan) {
        return NextResponse.json(
          {
            success: false,
            error: 'Plan not found',
          },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: plan,
      });
    }

    let filteredPlans = plansData;

    if (corporateId) {
      filteredPlans = filteredPlans.filter(p => p.corporateId === corporateId);
    }

    return NextResponse.json({
      success: true,
      data: filteredPlans,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch plans',
      },
      { status: 500 }
    );
  }
}

