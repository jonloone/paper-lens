import { CopilotBackend, OpenAIAdapter } from '@copilotkit/backend';
import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

const copilotKit = new CopilotBackend();

export async function POST(req: NextRequest) {
  // Configure OpenAI client with Vultr inference endpoint
  const openai = new OpenAI({
    apiKey: process.env.VULTR_API_KEY || process.env.COPILOT_CLOUD_API_KEY,
    baseURL: process.env.VULTR_INFERENCE_URL || 'https://api.vultrinference.com/v1',
  });

  const openaiAdapter = new OpenAIAdapter({
    openai,
    model: 'mistral-nemo-instruct-2407', // Default Vultr model
  });

  return copilotKit.response(req, openaiAdapter);
}