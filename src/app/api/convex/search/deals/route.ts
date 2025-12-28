import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, stage, limit = 10 } = body;

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

    // Call Convex to search deals
    const response = await fetch(`${convexUrl}/search-deals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchTerm: query,
        stage: stage,
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
      results: results.map((deal: any) => ({
        id: deal._id,
        name: deal.name,
        type: 'deal',
        subtitle: deal.stage && deal.value ? `${deal.stage} - $${deal.value}` : deal.stage || `$${deal.value}` || '',
        metadata: {
          amount: deal.value,
          stage: deal.stage,
          owner: deal.owner,
          company: deal.company?.name,
          closedDate: deal.closedDate,
        },
      })),
      count: results.length,
    });
  } catch (error) {
    console.error('Search deals error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search deals',
      },
      { status: 500 }
    );
  }
}
