'use client';

import React from 'react';
import { CopilotChat } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';
import { useCopilotChat } from '@copilotkit/react-core';
import { Sparkles } from 'lucide-react';

interface TiSQLAgentChatProps {
  catalog: string;
  schema: string;
  environment: string;
  className?: string;
}

/**
 * TiSQLAgentChat - CopilotKit-powered SQL Agent Chat
 *
 * Features:
 * - Full context awareness (editor state, selected sources, product definition)
 * - 7 frontend actions for SQL operations
 * - Streaming responses
 * - Generative UI support (future phase)
 * - AG-UI protocol ready
 */
export function TiSQLAgentChat({
  catalog,
  schema,
  environment,
  className,
}: TiSQLAgentChatProps) {
  return (
    <div className={`h-full flex flex-col ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">SQL Agent</h3>
            <p className="text-xs text-muted-foreground">
              {catalog}.{schema} • {environment}
            </p>
          </div>
        </div>
      </div>

      {/* CopilotKit Chat */}
      <div className="flex-1 overflow-hidden">
        <CopilotChat
          labels={{
            title: 'SQL Agent',
            initial: 'Ask me to generate SQL queries, explain code, optimize performance, or get table information.',
            placeholder: 'Ask about SQL, tables, or optimizations...',
          }}
          instructions={`You are an expert SQL agent for a data lakehouse platform. You help users:
- Generate SQL queries from natural language
- Explain and optimize existing queries
- Explore table schemas and data
- Estimate query costs and performance
- Insert SQL directly into the editor

Current environment: ${environment.toUpperCase()}
Database: ${catalog}.${schema}

Always use the provided actions to interact with the workstation:
- Use "insertSQL" to add SQL to the editor
- Use "executeQuery" to run and preview results
- Use "getTableSchema" to explore table structures
- Use "getSampleData" to see example data
- Use "explainQuery" to analyze SQL
- Use "optimizeQuery" to suggest improvements
- Use "estimateCost" to calculate query costs

Be concise, practical, and always explain your suggestions.`}
          makeSystemMessage={(message) => {
            return `${message}\n\nIMPORTANT: You have access to the current SQL in the editor, selected data sources, and product context. Use this information to provide relevant suggestions.`;
          }}
        />
      </div>
    </div>
  );
}

/**
 * Headless version using useCopilotChat hook
 * For custom UI implementations
 */
export function useTiSQLAgent() {
  const {
    visibleMessages,
    appendMessage,
    setMessages,
    isLoading,
    stop,
    reloadMessages,
  } = useCopilotChat();

  const sendMessage = async (content: string) => {
    await appendMessage({
      content,
      role: 'user',
    });
  };

  return {
    messages: visibleMessages,
    sendMessage,
    isLoading,
    stop,
    clear: () => setMessages([]),
    reload: reloadMessages,
  };
}
