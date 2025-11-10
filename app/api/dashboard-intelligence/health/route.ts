/**
 * Dashboard Intelligence Health Check Proxy
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/dashboard-intelligence/health`);
    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error: any) {
    console.error('[Dashboard Intelligence Health] Proxy error:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'dashboard-intelligence',
        crewai_available: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
