import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/context/chat-agent-query
 *
 * Query Living Context Graph for chat agent intelligence.
 * Returns intent context, usage patterns, and semantic bridges for evidence-based responses.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.productId) {
      return NextResponse.json(
        { error: 'Missing required field: productId' },
        { status: 400 }
      );
    }

    // Proxy to Python backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/context/chat-agent-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: body.productId,
        domain: body.domain,
        includeUsagePatterns: body.includeUsagePatterns ?? true,
        includeIntentContext: body.includeIntentContext ?? true,
        includeSemanticBridges: body.includeSemanticBridges ?? true,
        limit: body.limit ?? 10,
      }),
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
    console.error('Error querying Living Context Graph:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
