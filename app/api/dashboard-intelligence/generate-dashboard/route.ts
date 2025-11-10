/**
 * Dashboard Intelligence API Proxy
 *
 * Proxies dashboard generation requests from frontend to FastAPI backend.
 * This runs server-side to avoid CORS issues and browser limitations.
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[Dashboard Intelligence] Proxying generation request to backend');

    const response = await fetch(`${BACKEND_URL}/api/dashboard-intelligence/generate-dashboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      // Increase timeout for long-running CrewAI operations (multi-agent workflow takes ~3.5-4 minutes)
      signal: AbortSignal.timeout(300000), // 5 minutes for full CrewAI workflow
    });

    const data = await response.json();

    console.log(`[Dashboard Intelligence] Backend responded with status ${response.status}`);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error: any) {
    console.error('[Dashboard Intelligence] Proxy error:', error);

    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Dashboard generation timed out. This typically happens with very complex queries. Please try a simpler query or contact support.',
          valid: false,
          validatedDashboard: null,
          validationErrors: [],
          usedCrewAI: false
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate dashboard',
        valid: false,
        validatedDashboard: null,
        validationErrors: [],
        usedCrewAI: false
      },
      { status: 500 }
    );
  }
}
