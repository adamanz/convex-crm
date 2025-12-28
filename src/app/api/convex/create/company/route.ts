import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, industry, location, website, employees } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Get Convex URL from environment
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error('NEXT_PUBLIC_CONVEX_URL not configured');
    }

    // Call Convex to create company
    const response = await fetch(`${convexUrl}/create-company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        industry: industry || undefined,
        location: location || undefined,
        website: website || undefined,
        employees: employees || undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`Convex API error: ${response.statusText}`);
    }

    const company = await response.json();

    // Format response for ElevenLabs agent
    return NextResponse.json({
      success: true,
      company: {
        id: company._id,
        name: company.name,
        industry: company.industry,
        location: company.location,
        website: company.website,
        employees: company.employees,
        createdAt: company.createdAt,
      },
      message: `Successfully created company: ${name}`,
    });
  } catch (error) {
    console.error('Create company error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create company',
      },
      { status: 500 }
    );
  }
}
