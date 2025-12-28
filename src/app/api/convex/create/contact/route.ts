import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, title, company } = body;

    // Validate required fields
    if (!lastName) {
      return NextResponse.json(
        { success: false, error: 'Last name is required' },
        { status: 400 }
      );
    }

    // Get Convex URL from environment
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error('NEXT_PUBLIC_CONVEX_URL not configured');
    }

    // Call Convex to create contact
    const response = await fetch(`${convexUrl}/create-contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: firstName || undefined,
        lastName,
        email: email || undefined,
        phone: phone || undefined,
        title: title || undefined,
        company: company || undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`Convex API error: ${response.statusText}`);
    }

    const contact = await response.json();

    // Format response for ElevenLabs agent
    return NextResponse.json({
      success: true,
      contact: {
        id: contact._id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        title: contact.title,
        createdAt: contact.createdAt,
      },
      message: `Successfully created contact: ${firstName} ${lastName}`,
    });
  } catch (error) {
    console.error('Create contact error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create contact',
      },
      { status: 500 }
    );
  }
}
