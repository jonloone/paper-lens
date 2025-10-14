import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/context/create-intent
 *
 * Proxies intent creation request to Python backend
 * Backend will create IntentNode with automatic quality inference
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.dataProductId || !body.stakeholder || !body.businessNeed) {
      return NextResponse.json(
        { error: 'Missing required fields: dataProductId, stakeholder, businessNeed' },
        { status: 400 }
      );
    }

    // Proxy to Python backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/context/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Backend request failed',
      }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
