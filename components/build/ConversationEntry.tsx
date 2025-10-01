'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, FileText, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ConversationEntryProps {
  onComplete?: (context: any) => void;
}

export function ConversationEntry({ onComplete }: ConversationEntryProps) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!input.trim()) {
      setError('Please enter a request description');
      return;
    }

    setExtracting(true);
    setError(null);

    try {
      // Step 1: Call Phase 1 parse endpoint
      const parseResponse = await fetch('/api/build/request/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: input,
          requester: 'current-user@company.com', // TODO: Get from auth
          context: {}
        })
      });

      if (!parseResponse.ok) {
        throw new Error('Failed to parse request');
      }

      const basicParse = await parseResponse.json();

      // Step 2: Call Phase 2 KAG enhancement (with fallback)
      let enhanced = null;
      try {
        const kagResponse = await fetch('http://localhost:8000/api/kag/parse-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: input,
            domain: basicParse.extracted?.namespace || 'general',
            requester: 'current-user@company.com',
            context: {}
          })
        });

        if (kagResponse.ok) {
          enhanced = await kagResponse.json();
        }
      } catch (kagError) {
        console.warn('KAG enhancement unavailable, using basic parsing:', kagError);
      }

      // Step 3: Merge results
      const merged = {
        ...basicParse.extracted,
        original_input: input,
        confidence: basicParse.confidence,
        // Add KAG enhancements if available
        ...(enhanced && {
          similar_contracts: enhanced.similar_contracts || [],
          domain_patterns: enhanced.domain_patterns || [],
          graph_insights: enhanced.understanding || {},
          kag_confidence: enhanced.confidence,
          confidence: Math.max(basicParse.confidence, enhanced.confidence || 0)
        })
      };

      // Navigate to context confirmation
      if (onComplete) {
        onComplete(merged);
      } else {
        const params = new URLSearchParams({
          data: JSON.stringify(merged)
        });
        router.push(`/build/confirm?${params.toString()}`);
      }
    } catch (err) {
      console.error('Extraction error:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract context');
    } finally {
      setExtracting(false);
    }
  };

  const exampleText = `Hey Sarah, Jennifer from Marketing needs customer churn data for the Q4 campaign. She needs it by Friday with 95% accuracy. Can you help?`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">What are you building?</h1>
        <p className="text-muted-foreground text-lg">
          Paste your request from Slack, email, or just describe what you need
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <Textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          placeholder={exampleText}
          className="min-h-[200px] text-base resize-none focus-visible:ring-2 focus-visible:ring-primary"
          disabled={extracting}
        />

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        <Button
          onClick={handleExtract}
          disabled={!input.trim() || extracting}
          className="w-full h-12 text-base"
          size="lg"
        >
          {extracting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Extracting Context...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Extract Context & Continue
            </>
          )}
        </Button>
      </Card>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Or:</span>
        <button
          className="flex items-center gap-2 hover:text-foreground transition-colors"
          onClick={() => {
            // TODO: Implement URL parsing
            alert('URL parsing coming soon!');
          }}
        >
          <Link2 className="h-4 w-4" />
          Paste Jira/ServiceNow URL
        </button>
        <span>|</span>
        <button
          className="flex items-center gap-2 hover:text-foreground transition-colors"
          onClick={() => {
            // TODO: Navigate to manual form
            router.push('/build/manual');
          }}
        >
          <FileText className="h-4 w-4" />
          Fill form manually
        </button>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-2 border border-muted">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Powered by AI + Graph Intelligence</p>
            <p className="text-sm text-muted-foreground">
              We'll extract stakeholders, deadlines, quality requirements, and suggest similar
              projects you can copy from. The more you use it, the smarter it gets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
