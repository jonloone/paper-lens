import { NextRequest, NextResponse } from 'next/server';
import { lineageService } from '@/lib/services/dataLineage';
import { lineageIntegration } from '@/lib/services/lineageIntegration';

// GET /api/lineage - Get data lineage
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');
    const search = searchParams.get('search');
    const depth = parseInt(searchParams.get('depth') || '3');
    const direction = searchParams.get('direction') as 'upstream' | 'downstream' | 'both' || 'both';
    const mode = searchParams.get('mode') || 'legacy'; // 'legacy' or 'enhanced'
    
    // Search for entities
    if (search) {
      const results = lineageService.searchLineage(search);
      return NextResponse.json({
        results,
        total: results.length
      });
    }
    
    // Get lineage for specific entity
    if (entityId) {
      // Use enhanced integration service if requested
      if (mode === 'enhanced') {
        const integratedLineage = await lineageIntegration.getIntegratedLineage(entityId);
        return NextResponse.json({
          lineage: {
            nodes: integratedLineage.nodes,
            edges: integratedLineage.edges,
            metadata: {
              version: '2.0.0',
              generated: new Date(),
              scope: 'integrated',
              depth
            }
          },
          entityId,
          mode: 'enhanced'
        });
      }
      
      // Use legacy service for backward compatibility
      const lineage = lineageService.getLineage(entityId, depth, direction);
      const stats = lineageService.getDataFlowStats(entityId);
      
      return NextResponse.json({
        lineage,
        stats,
        entityId,
        mode: 'legacy'
      });
    }
    
    // Return error if no parameters provided
    return NextResponse.json(
      { error: 'entityId or search parameter required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching lineage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lineage' },
      { status: 500 }
    );
  }
}

// POST /api/lineage/impact - Analyze impact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityId, changeType } = body;
    
    if (!entityId || !changeType) {
      return NextResponse.json(
        { error: 'entityId and changeType required' },
        { status: 400 }
      );
    }
    
    // Validate change type
    const validChangeTypes = ['schema', 'deletion', 'quality', 'maintenance'];
    if (!validChangeTypes.includes(changeType)) {
      return NextResponse.json(
        { error: `changeType must be one of: ${validChangeTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Perform impact analysis
    const impact = lineageService.analyzeImpact(entityId, changeType as any);
    
    return NextResponse.json(impact);
  } catch (error) {
    console.error('Error analyzing impact:', error);
    return NextResponse.json(
      { error: 'Failed to analyze impact' },
      { status: 500 }
    );
  }
}