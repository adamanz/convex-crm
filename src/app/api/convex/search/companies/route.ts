import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit = 10 } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Get Convex URL from environment
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error('NEXT_PUBLIC_CONVEX_URL not configured');
    }

    // Call Convex to search companies
    const response = await fetch(`${convexUrl}/search-companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchTerm: query,
        limit: Math.min(limit, 50),
      }),
    });

    if (!response.ok) {
      throw new Error(`Convex API error: ${response.statusText}`);
    }

    const results = await response.json();

    // Format response for ElevenLabs agent and SearchResultsModal
    return NextResponse.json({
      success: true,
      results: results.map((company: any) => ({
        id: company._id,
        name: company.name,
        type: 'company',
        subtitle: company.industry || company.location || '',
        metadata: {
          industry: company.industry,
          location: company.location,
          website: company.website,
          employees: company.employees,
        },
      })),
      count: results.length,
    });
  } catch (error) {
    console.error('Search companies error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search companies',
      },
      { status: 500 }
    );
  }
}
