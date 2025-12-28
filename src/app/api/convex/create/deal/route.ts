import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, amount, stage, owner, company, closeDate } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Deal name is required' },
        { status: 400 }
      );
    }

    // Get Convex URL from environment
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error('NEXT_PUBLIC_CONVEX_URL not configured');
    }

    // Call Convex to create deal
    const response = await fetch(`${convexUrl}/create-deal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        value: amount || 0,
        stage: stage || 'prospecting',
        owner: owner || undefined,
        company: company || undefined,
        closedDate: closeDate ? new Date(closeDate).getTime() : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`Convex API error: ${response.statusText}`);
    }

    const deal = await response.json();

    // Format response for ElevenLabs agent
    return NextResponse.json({
      success: true,
      deal: {
        id: deal._id,
        name: deal.name,
        amount: deal.value,
        stage: deal.stage,
        owner: deal.owner,
        company: deal.company?.name,
        closeDate: deal.closedDate,
        createdAt: deal.createdAt,
      },
      message: `Successfully created deal: ${name} (${amount ? '$' + amount : 'No amount'})`,
    });
  } catch (error) {
    console.error('Create deal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create deal',
      },
      { status: 500 }
    );
  }
}
