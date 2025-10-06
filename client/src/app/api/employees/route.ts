import { NextRequest, NextResponse } from 'next/server';
import employeesData from '@/data/employees.json';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('id');
    const corporateId = searchParams.get('corporateId');
    const planId = searchParams.get('planId');

    if (employeeId) {
      const employee = employeesData.find(e => e.id === employeeId);
      if (!employee) {
        return NextResponse.json(
          {
            success: false,
            error: 'Employee not found',
          },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: employee,
      });
    }

    let filteredEmployees = employeesData;

    if (corporateId) {
      filteredEmployees = filteredEmployees.filter(e => e.corporateId === corporateId);
    }

    if (planId) {
      filteredEmployees = filteredEmployees.filter(e => e.planId === planId);
    }

    return NextResponse.json({
      success: true,
      data: filteredEmployees,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch employees',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.corporateId || !body.planId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // In a real app, this would save to database
    const newEmployee = {
      id: `emp-${Date.now()}`,
      employeeNumber: `E-${Date.now().toString().slice(-4)}`,
      ...body,
    };

    return NextResponse.json({
      success: true,
      data: newEmployee,
      message: 'Employee created successfully',
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create employee',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee ID is required',
        },
        { status: 400 }
      );
    }

    // In a real app, this would update in database
    const updatedEmployee = {
      id,
      ...updateData,
    };

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      message: 'Employee updated successfully',
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update employee',
      },
      { status: 500 }
    );
  }
}

