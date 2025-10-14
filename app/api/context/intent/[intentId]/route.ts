import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/context/intent/[intentId]
 *
 * Proxies intent retrieval request to Python backend
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { intentId: string } }
) {
  try {
    const { intentId } = params;

    if (!intentId) {
      return NextResponse.json(
        { error: 'Intent ID is required' },
        { status: 400 }
      );
    }

    // Proxy to Python backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/context/intent/${intentId}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Backend request failed',
      }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error retrieving intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
