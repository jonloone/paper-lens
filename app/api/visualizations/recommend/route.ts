import { NextRequest, NextResponse } from 'next/server';
import { aiVisualizationRecommender } from '@/lib/services/ai-visualization-recommender';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/visualizations/recommend
 * Get AI-powered visualization recommendation for data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      columns,
      rows,
      userQuery,
      sqlQuery,
      context,
    } = body;

    // Validation
    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json(
        { error: 'Columns array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'Rows array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Get recommendation
    const recommendation = await aiVisualizationRecommender.recommendVisualization(
      columns,
      rows,
      userQuery,
      sqlQuery,
      context
    );

    return NextResponse.json({
      success: true,
      recommendation,
      metadata: {
        rowCount: rows.length,
        columnCount: columns.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Visualization recommendation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate visualization recommendation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/visualizations/recommend?goal=comparison
 * Get recommended chart types for a specific analytical goal
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const goal = searchParams.get('goal');

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal parameter is required' },
        { status: 400 }
      );
    }

    const chartTypes = aiVisualizationRecommender.getChartsForAnalyticalGoal(goal);

    return NextResponse.json({
      success: true,
      goal,
      chartTypes,
    });
  } catch (error) {
    console.error('Error getting charts for goal:', error);

    return NextResponse.json(
      {
        error: 'Failed to get chart types',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
