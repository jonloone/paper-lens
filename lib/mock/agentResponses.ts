import type { TaskType, UserRole } from '@/app/workstation/page';

export interface NaturalLanguageResponse {
  confidence: number;
  suggestedTask: TaskType | null;
  entities: Record<string, string>;
  reasoning: string;
}

export async function processNaturalLanguage(
  input: string, 
  role: UserRole
): Promise<NaturalLanguageResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  const lowerInput = input.toLowerCase();
  
  // Entity extraction
  const entities: Record<string, string> = {};
  
  // Data sources
  if (lowerInput.includes('salesforce')) entities.source = 'Salesforce';
  if (lowerInput.includes('snowflake')) entities.destination = 'Snowflake';
  if (lowerInput.includes('kafka')) entities.streaming = 'Kafka';
  if (lowerInput.includes('s3')) entities.storage = 'S3';
  
  // Data types
  if (lowerInput.includes('customer')) entities.dataType = 'Customer Data';
  if (lowerInput.includes('sales') || lowerInput.includes('revenue')) entities.dataType = 'Sales Data';
  if (lowerInput.includes('event')) entities.dataType = 'Event Data';
  
  // Task classification
  let suggestedTask: TaskType | null = null;
  let confidence = 0.5;
  
  // Pipeline building keywords
  if (lowerInput.includes('pipeline') || lowerInput.includes('etl') || lowerInput.includes('merge') || lowerInput.includes('integrate')) {
    suggestedTask = 'build_pipeline';
    confidence = 0.8;
  }
  
  // Query optimization keywords
  if (lowerInput.includes('slow') || lowerInput.includes('optimize') || lowerInput.includes('performance') || lowerInput.includes('query')) {
    suggestedTask = 'optimize_query';
    confidence = 0.75;
  }
  
  // Data testing keywords
  if (lowerInput.includes('test') || lowerInput.includes('quality') || lowerInput.includes('validate') || lowerInput.includes('check')) {
    suggestedTask = 'test_data';
    confidence = 0.7;
  }
  
  // Connection setup keywords
  if (lowerInput.includes('connect') || lowerInput.includes('setup') || lowerInput.includes('configure')) {
    suggestedTask = 'add_connection';
    confidence = 0.65;
  }
  
  // Dashboard creation keywords
  if (lowerInput.includes('dashboard') || lowerInput.includes('visualize') || lowerInput.includes('chart') || lowerInput.includes('report')) {
    suggestedTask = 'create_dashboard';
    confidence = 0.8;
  }
  
  // Query to product keywords
  if (lowerInput.includes('product') && lowerInput.includes('query')) {
    suggestedTask = 'query_to_product';
    confidence = 0.85;
  }
  
  // Role-specific adjustments
  if (role === 'executive' && (lowerInput.includes('kpi') || lowerInput.includes('business') || lowerInput.includes('strategic'))) {
    suggestedTask = 'create_dashboard';
    confidence = Math.min(confidence + 0.2, 0.95);
  }
  
  if (role === 'data_analyst' && (lowerInput.includes('explore') || lowerInput.includes('analyze'))) {
    suggestedTask = 'explore_lineage';
    confidence = Math.min(confidence + 0.15, 0.9);
  }
  
  return {
    confidence,
    suggestedTask,
    entities,
    reasoning: `Based on keywords: ${Object.keys(entities).length > 0 ? Object.keys(entities).join(', ') : 'general analysis'}`
  };
}