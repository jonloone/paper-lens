import { NextRequest, NextResponse } from 'next/server';
import { 
  qualityValidator, 
  QualityRule, 
  DEFAULT_QUALITY_RULES 
} from '@/lib/services/qualityValidation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      data, 
      rules, 
      threshold = 85,
      pipelineId,
      executionId 
    } = body;
    
    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Data array is required' },
        { status: 400 }
      );
    }
    
    // Use custom rules if provided, otherwise use defaults
    const rulesToApply = rules || DEFAULT_QUALITY_RULES;
    
    // Perform validation
    const validationResult = await qualityValidator.validateData(
      data,
      rulesToApply,
      threshold
    );
    
    // Add metadata
    const response = {
      ...validationResult,
      metadata: {
        pipelineId,
        executionId,
        timestamp: new Date(),
        recordCount: data.length,
        threshold,
        rulesApplied: rulesToApply.length
      }
    };
    
    // Return appropriate status based on validation result
    const status = validationResult.passed ? 200 : 
                   validationResult.blockers.length > 0 ? 422 : 200;
    
    return NextResponse.json(response, { status });
  } catch (error) {
    console.error('Error validating quality:', error);
    return NextResponse.json(
      { error: 'Failed to validate quality' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve available quality rules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dimension = searchParams.get('dimension');
    
    let rules: QualityRule[];
    
    if (dimension) {
      rules = qualityValidator.getRulesByDimension(dimension);
    } else {
      rules = qualityValidator.getRules();
    }
    
    // Group rules by dimension for better organization
    const groupedRules = rules.reduce((acc, rule) => {
      if (!acc[rule.dimension]) {
        acc[rule.dimension] = [];
      }
      acc[rule.dimension].push(rule);
      return acc;
    }, {} as Record<string, QualityRule[]>);
    
    return NextResponse.json({
      rules,
      groupedRules,
      dimensions: Object.keys(groupedRules),
      totalRules: rules.length
    });
  } catch (error) {
    console.error('Error fetching quality rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quality rules' },
      { status: 500 }
    );
  }
}