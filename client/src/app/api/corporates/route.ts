import { NextRequest, NextResponse } from 'next/server';
import corporatesData from '@/data/corporates.json';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const corporateId = searchParams.get('id');

    if (corporateId) {
      const corporate = corporatesData.find(c => c.id === corporateId);
      if (!corporate) {
        return NextResponse.json(
          {
            success: false,
            error: 'Corporate not found',
          },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: corporate,
      });
    }

    return NextResponse.json({
      success: true,
      data: corporatesData,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch corporates',
      },
      { status: 500 }
    );
  }
}

