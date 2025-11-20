/**
 * Dashboard Intelligence API Proxy
 *
 * Proxies dashboard generation requests from frontend to FastAPI backend.
 * This runs server-side to avoid CORS issues and browser limitations.
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// Increase Next.js route timeout to 10 minutes for CrewAI operations
export const maxDuration = 600; // 10 minutes in seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[Dashboard Intelligence] Proxying generation request to backend');

    // Create an AbortController with 8-minute timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 480000); // 8 minutes (480 seconds)

    try {
      const response = await fetch(`${BACKEND_URL}/api/dashboard-intelligence/generate-dashboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Connection': 'keep-alive',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        // @ts-ignore - undici-specific options
        keepalive: true,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      console.log(`[Dashboard Intelligence] Backend responded with status ${response.status}`);

      return NextResponse.json(data, {
        status: response.status,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error: any) {
    console.error('[Dashboard Intelligence] Proxy error:', error);
    console.error('[Dashboard Intelligence] Error name:', error.name);
    console.error('[Dashboard Intelligence] Error message:', error.message);

    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Dashboard generation timed out. This typically happens with very complex queries or when the AI service is under heavy load. Please try again or use a simpler query.',
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
