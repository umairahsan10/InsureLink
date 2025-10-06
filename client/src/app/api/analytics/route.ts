import { NextResponse } from 'next/server';
import analyticsData from '@/data/analytics.json';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: analyticsData,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics',
      },
      { status: 500 }
    );
  }
}

