import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/context/enrich-intent-with-profiling
 *
 * Proxies intent enrichment request to Python backend
 * Backend will enrich IntentNode with profiling results and perform quality gap analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.intentId || !body.actualQuality || !body.issues || !body.columnStats) {
      return NextResponse.json(
        { error: 'Missing required fields: intentId, actualQuality, issues, columnStats' },
        { status: 400 }
      );
    }

    // Proxy to Python backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/context/enrich-intent-with-profiling`, {
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
    console.error('Error enriching intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
