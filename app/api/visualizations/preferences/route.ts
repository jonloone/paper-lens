import { NextRequest, NextResponse } from 'next/server';
import { aiVisualizationRecommender } from '@/lib/services/ai-visualization-recommender';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/visualizations/preferences
 * Record user's visualization preference for learning
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { chartType, wasAccepted } = body;

    // Validation
    if (!chartType || typeof chartType !== 'string') {
      return NextResponse.json(
        { error: 'chartType is required and must be a string' },
        { status: 400 }
      );
    }

    if (typeof wasAccepted !== 'boolean') {
      return NextResponse.json(
        { error: 'wasAccepted is required and must be a boolean' },
        { status: 400 }
      );
    }

    // Record preference
    aiVisualizationRecommender.recordUserPreference(chartType, wasAccepted);

    return NextResponse.json({
      success: true,
      message: 'Preference recorded successfully',
      chartType,
      wasAccepted,
    });
  } catch (error) {
    console.error('Error recording visualization preference:', error);

    return NextResponse.json(
      {
        error: 'Failed to record preference',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/visualizations/preferences
 * Get current user preferences (for debugging/admin)
 */
export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would fetch from a database
    // For now, we just return a success message since preferences
    // are stored in memory in the recommender service

    return NextResponse.json({
      success: true,
      message: 'Preferences are being tracked in the AI recommender service',
      note: 'Preferences are currently stored in-memory and will be lost on server restart',
    });
  } catch (error) {
    console.error('Error getting preferences:', error);

    return NextResponse.json(
      {
        error: 'Failed to get preferences',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
