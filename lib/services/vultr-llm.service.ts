/**
 * VultrLLMService - Direct integration with Vultr's LLM API
 * Used for agent intent analysis and natural language processing
 */

interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'text';
}

interface LLMResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

export class VultrLLMService {
  private apiKey: string;
  private baseURL: string;
  private model: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // milliseconds

  constructor() {
    this.apiKey = process.env.VULTR_API_KEY || 'NQCHCWXPSWQ3JL6IM5NT5EBD4FNOK5S7AEZA';
    this.baseURL = 'https://api.vultrinference.com/v1';
    this.model = 'mistral-nemo-instruct-2407';
  }

  /**
   * Sleep for a specified duration
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Analyze a prompt and return the LLM response with retry logic
   */
  async analyze(request: LLMRequest): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const messages = [
        {
          role: 'system',
          content: request.systemPrompt
        },
        {
          role: 'user',
          content: request.userPrompt
        }
      ];

      // Add JSON formatting instruction if needed
      if (request.responseFormat === 'json') {
        messages[0].content += '\n\nIMPORTANT: You must respond with valid JSON only. No additional text or markdown formatting.';
      }

        const requestBody = {
          model: this.model,
          messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 1000,
          stream: false // Non-streaming for simplicity in agent context
        };

        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        }).catch(error => {
          // Network or timeout errors
          if (error.name === 'AbortError') {
            throw new Error('Request timeout after 30 seconds');
          }
          throw new Error(`Network error: ${error.message}`);
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          
          // Check for rate limiting
          if (response.status === 429) {
            throw new Error(`Rate limit exceeded. Please try again later.`);
          }
          
          // Check for authentication errors
          if (response.status === 401) {
            throw new Error(`Authentication failed. Please check your API key.`);
          }
          
          // Check for server errors (retry-able)
          if (response.status >= 500) {
            throw new Error(`Server error (${response.status}): ${errorText}`);
          }
          
          // Client errors (non-retry-able)
          throw new Error(`API error (${response.status}): ${errorText}`);
        }

      const data = await response.json();
      
      // Extract the content from the response
      const content = data.choices?.[0]?.message?.content || '';
      
      // If JSON format requested, validate and clean the response
      if (request.responseFormat === 'json') {
        try {
          // Remove any markdown code blocks if present
          const cleanedContent = content
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
          
          // Validate it's proper JSON
          JSON.parse(cleanedContent);
          return cleanedContent;
        } catch (error) {
          console.error('Invalid JSON response from LLM:', content);
          throw new Error('LLM returned invalid JSON response');
        }
      }

        return content;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`VultrLLMService attempt ${attempt}/${this.maxRetries} failed:`, lastError.message);
        
        // Don't retry on non-retryable errors
        if (lastError.message.includes('Authentication failed') ||
            lastError.message.includes('Rate limit exceeded') ||
            lastError.message.includes('Invalid JSON response')) {
          throw lastError;
        }
        
        // If not the last attempt, wait before retrying
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * attempt; // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    // All retries exhausted
    throw new Error(`Failed after ${this.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Stream a response from the LLM (for chat interfaces)
   */
  async *stream(request: LLMRequest): AsyncGenerator<string, void, unknown> {
    try {
      const messages = [
        {
          role: 'system',
          content: request.systemPrompt
        },
        {
          role: 'user',
          content: request.userPrompt
        }
      ];

      const requestBody = {
        model: this.model,
        messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1000,
        stream: true
      };

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vultr API error: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              return;
            }

            try {
              const chunk = JSON.parse(data);
              const content = chunk.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch {
              // Skip unparseable chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('VultrLLMService streaming error:', error);
      throw error;
    }
  }

  /**
   * Test the connection to the Vultr API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.analyze({
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: 'Respond with "OK" if you receive this message.',
        maxTokens: 10
      });
      return response.includes('OK');
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}