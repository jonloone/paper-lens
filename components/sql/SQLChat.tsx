'use client';

import { useChat } from '@ai-sdk/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SQLChatHeader } from './SQLChatHeader';
import { SQLChatInput } from './SQLChatInput';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { TypingIndicator } from './TypingIndicator';
import type { SQLContext } from './types';
import { useRef, useEffect } from 'react';

export interface SQLChatProps {
  context: SQLContext;
  onSQLGenerated?: (sql: string, metadata?: { explanation: string; tables: string[] }) => void;
  className?: string;
  placeholder?: string;
}

/**
 * SQLChat - Main chat component using Vercel AI SDK
 *
 * Features:
 * - Streaming responses with SSE
 * - Tool calling (generateSQL, executeQuery, etc.)
 * - Markdown rendering with syntax highlighting
 * - Artifact extraction and rendering
 * - Context awareness
 * - Always uses best model via CrewAI orchestration
 */
export function SQLChat({
  context,
  onSQLGenerated,
  className = '',
  placeholder = 'Ask me to generate SQL, explain queries, or optimize performance...'
}: SQLChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
  } = useChat({
    api: '/api/chat',
    body: {
      context,
    },
    onFinish: (message) => {
      // Extract SQL from code blocks if AI generated it
      const sqlMatch = message.content.match(/```sql\n([\s\S]*?)\n```/);
      if (sqlMatch && onSQLGenerated) {
        onSQLGenerated(sqlMatch[1], {
          explanation: message.content,
          tables: context.selectedTables.map(t => t.name),
        });
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  return (
    <div className={`flex flex-col h-full bg-card ${className}`}>
      {/* Header */}
      <SQLChatHeader
        context={context}
        onClearChat={() => {
          // TODO: Implement clear chat
          window.location.reload();
        }}
      />

      {/* Message List */}
      <ScrollArea className="flex-1 px-6">
        <div className="space-y-6 py-6">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-12">
              <p>Ask me anything about SQL, data analysis, or query optimization.</p>
              {context.selectedTables.length > 0 && (
                <p className="mt-2">
                  I have context about {context.selectedTables.length} table{context.selectedTables.length > 1 ? 's' : ''}.
                </p>
              )}
            </div>
          )}

          {messages.map((message) => (
            message.role === 'user' ? (
              <UserMessage key={message.id} message={message} />
            ) : (
              <AssistantMessage
                key={message.id}
                message={message}
                onInsertSQL={onSQLGenerated}
              />
            )
          ))}

          {isLoading && <TypingIndicator />}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <SQLChatInput
        input={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        onStop={stop}
        isLoading={isLoading}
        placeholder={placeholder}
        disabled={false}
      />
    </div>
  );
}
