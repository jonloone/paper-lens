import { NextRequest, NextResponse } from 'next/server';
import { templateService } from '@/lib/templates/pipelineTemplates';

// GET /api/pipelines/templates - Get pipeline templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const id = searchParams.get('id');
    
    // Get specific template by ID
    if (id) {
      const template = templateService.getTemplate(id);
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(template);
    }
    
    // Get templates with filters
    let templates = templateService.getAllTemplates();
    
    if (category) {
      templates = templateService.getTemplatesByCategory(category);
    }
    
    if (search) {
      templates = templateService.searchTemplates(search);
    }
    
    // Group by category for better organization
    const groupedTemplates = templates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as Record<string, typeof templates>);
    
    return NextResponse.json({
      templates,
      groupedTemplates,
      categories: Object.keys(groupedTemplates),
      total: templates.length
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/pipelines/templates - Generate pipeline from template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, parameters, action } = body;
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID required' },
        { status: 400 }
      );
    }
    
    // Validate parameters
    if (action === 'validate') {
      const validation = templateService.validateParameters(templateId, parameters || {});
      return NextResponse.json(validation);
    }
    
    // Generate pipeline configuration
    try {
      const pipelineConfig = templateService.generatePipeline(templateId, parameters || {});
      
      // Create pipeline object
      const pipeline = {
        id: `pipeline-${Date.now()}`,
        name: parameters.name || `Pipeline from ${templateId}`,
        templateId,
        config: pipelineConfig,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return NextResponse.json(pipeline, { status: 201 });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error generating pipeline from template:', error);
    return NextResponse.json(
      { error: 'Failed to generate pipeline' },
      { status: 500 }
    );
  }
}