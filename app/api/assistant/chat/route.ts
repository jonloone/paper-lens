/**
 * API Route for Assistant-UI Chat
 * Handles streaming chat completions with Vultr API
 */

import { NextRequest } from 'next/server';

// Vultr configuration
const VULTR_API_KEY = process.env.VULTR_API_KEY || 'NQCHCWXPSWQ3JL6IM5NT5EBD4FNOK5S7AEZA';
const VULTR_MODEL = 'mistral-nemo-instruct-2407';
const VULTR_BASE_URL = 'https://api.vultrinference.com/v1';

// Assistant configuration
const ASSISTANT_CONFIG = {
  temperature: 0.7,
  maxTokens: 2048,
  systemPromptTemplate: (context: any) => {
    const basePrompt = `You are an intelligent assistant for NexusOne, an enterprise data engineering orchestration platform.
You help data engineers with pipeline management, data quality issues, query optimization, and cross-tool workflows.
You have deep knowledge of Apache Airflow, Trino, DataHub, NiFi, Apache Iceberg, and modern data stack tools.
Keep responses focused and actionable, under 3-4 sentences unless the user asks for more detail.`;

    if (context?.type === 'pipeline' && context?.pipeline) {
      return `${basePrompt}

Current context: Pipeline "${context.pipeline.name}"
- Status: ${context.pipeline.status}
- Schedule: ${context.pipeline.schedule}
- Success Rate: ${context.pipeline.successRate}%
- Last Run: ${context.pipeline.lastRun}
- Average Duration: ${context.pipeline.avgDuration} minutes

Focus on analyzing pipeline performance, identifying bottlenecks, and suggesting optimizations.`;
    }

    if (context?.type === 'investigation' && context?.failure) {
      return `${basePrompt}

Current context: Investigating failure in "${context.failure.pipeline}"
- Error: ${context.failure.error}
- Failed Task: ${context.failure.task}
- Time: ${context.failure.timestamp}
- Impact: ${context.failure.downstreamAffected} downstream pipelines affected

Focus on root cause analysis, checking for schema changes, data quality issues, and upstream dependencies.`;
    }

    if (context?.type === 'dataProduct' && context?.dataProduct) {
      return `${basePrompt}

Current context: Data Product "${context.dataProduct.name}"
- Table: ${context.dataProduct.table}
- Freshness: ${context.dataProduct.freshness}
- Consumers: ${context.dataProduct.consumers}
- Last Updated: ${context.dataProduct.lastUpdated}

Focus on data quality, access patterns, optimization opportunities, and usage analytics.`;
    }

    if (context?.type === 'query' && context?.query) {
      return `${basePrompt}

Current context: Query Optimization
- Query: ${context.query.sql?.substring(0, 100)}...
- Execution Time: ${context.query.executionTime}ms
- Rows Scanned: ${context.query.rowsScanned}
- Engine: ${context.query.engine || 'Trino'}

Focus on query optimization, index suggestions, partition pruning, and performance improvements.`;
    }

    return basePrompt;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context, threadId } = body;

    if (!messages || messages.length === 0) {
      return new Response('Messages are required', { status: 400 });
    }

    // Build system message based on context
    const systemMessage = context 
      ? { role: 'system', content: ASSISTANT_CONFIG.systemPromptTemplate(context) }
      : { role: 'system', content: 'You are a helpful assistant for NexusOne, an enterprise data engineering platform. I can help with pipelines, data quality, query optimization, and debugging data issues.' };

    // Combine system message with user messages
    const allMessages = [systemMessage, ...messages];

    console.log('[Vultr Assistant API] Processing request', {
      threadId,
      messageCount: messages.length,
      contextType: context?.type,
      model: VULTR_MODEL
    });

    try {
      // Make streaming request to Vultr
      const response = await fetch(`${VULTR_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VULTR_API_KEY}`,
        },
        body: JSON.stringify({
          model: VULTR_MODEL,
          messages: allMessages,
          temperature: ASSISTANT_CONFIG.temperature,
          max_tokens: ASSISTANT_CONFIG.maxTokens,
          stream: true
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Vultr Assistant API] Error:', response.status, errorText);
        throw new Error(`Vultr API error: ${response.status} ${response.statusText}`);
      }

      // Pass through the SSE stream from Vultr
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
      
    } catch (error: any) {
      // If Vultr API fails, use mock response
      if (error.code === 'ENOTFOUND' || error.message?.includes('fetch')) {
        console.log('[Vultr Assistant API] Using mock response');
        
        const mockResponse = getMockResponse(messages[messages.length - 1].content);
        const encoder = new TextEncoder();
        
        const readable = new ReadableStream({
          async start(controller) {
            const words = mockResponse.split(' ');
            for (let i = 0; i < words.length; i++) {
              const chunk = {
                id: 'mock-' + Date.now(),
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: VULTR_MODEL,
                choices: [{
                  delta: { content: words[i] + (i < words.length - 1 ? ' ' : '') },
                  index: 0,
                  finish_reason: null
                }]
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        });

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Mock-Mode': 'true'
          }
        });
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error('[Vultr Assistant API] Error:', error);

    // Handle specific error types
    if (error.message?.includes('API key')) {
      return new Response('API key not configured. Using mock responses.', { 
        status: 503,
        headers: { 'X-Mock-Mode': 'true' }
      });
    }

    if (error.message?.includes('rate limit')) {
      return new Response('Rate limit exceeded. Please try again later.', { 
        status: 429,
        headers: { 'Retry-After': '60' }
      });
    }

    // Generic error response
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error.message 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Helper function for mock responses
function getMockResponse(query: string): string {
  const q = query.toLowerCase();
  
  if (q.includes('fail') || q.includes('error')) {
    return "The pipeline failure appears to be caused by a schema mismatch in the upstream table. Check if recent deployments modified the source schema. Also verify disk space on the Trino workers and review the Airflow task logs for detailed error messages.";
  }
  
  if (q.includes('slow') || q.includes('performance')) {
    return "The query performance issue is likely due to missing partition pruning. Consider adding a date filter to leverage partitions, or materialize frequently-joined datasets. Also check if statistics are up-to-date in the metastore.";
  }
  
  if (q.includes('quality') || q.includes('validation')) {
    return "Implement data quality checks using Great Expectations or dbt tests. Key metrics to monitor: null rates, uniqueness violations, and referential integrity. Set up alerts when quality scores drop below 95%.";
  }
  
  if (q.includes('optimize') || q.includes('improve')) {
    return "To optimize this pipeline: 1) Use incremental processing instead of full refreshes, 2) Implement proper partitioning strategy (daily/hourly), 3) Cache intermediate results in Iceberg tables, 4) Parallelize independent tasks in your DAG.";
  }

  if (q.includes('cost') || q.includes('expensive')) {
    return "High costs are often from scanning full tables repeatedly. Implement incremental loads, use materialized views for common aggregations, and enable compression. Monitor query patterns to identify optimization opportunities.";
  }
  
  return "Based on the current metrics, your data pipeline is operating normally. Monitor for any schema changes upstream and ensure SLAs are being met. Consider implementing automated data quality checks for critical data products.";
}

// Health check endpoint
export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      provider: 'vultr',
      model: VULTR_MODEL,
      streaming: true,
      apiKey: VULTR_API_KEY ? 'configured' : 'missing'
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}