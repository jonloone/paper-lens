'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { BotIcon, CopyIcon, PlayIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { Message } from './types';

export interface AssistantMessageProps {
  message: Message;
  onInsertSQL?: (sql: string) => void;
}

/**
 * AssistantMessage - Displays AI assistant message with markdown
 *
 * Features:
 * - Markdown rendering with syntax highlighting
 * - Code block actions (copy, insert to editor)
 * - SQL artifact extraction
 * - GitHub Flavored Markdown support
 */
export function AssistantMessage({ message, onInsertSQL }: AssistantMessageProps) {
  const [copiedBlocks, setCopiedBlocks] = useState<Set<number>>(new Set());

  const handleCopy = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedBlocks(prev => new Set(prev).add(index));
    setTimeout(() => {
      setCopiedBlocks(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }, 2000);
  };

  const handleInsert = (code: string) => {
    if (onInsertSQL) {
      onInsertSQL(code);
    }
  };

  // Custom code block renderer with actions
  const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const code = String(children).replace(/\n$/, '');
    const isSql = language === 'sql';
    const blockIndex = node?.position?.start?.line || 0;

    if (inline) {
      return (
        <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }

    return (
      <div className="relative group my-4">
        {/* Language label */}
        {language && (
          <div className="absolute top-2 left-3 text-xs text-muted-foreground font-mono">
            {language}
          </div>
        )}

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleCopy(code, blockIndex)}
            className="h-7 px-2 text-xs"
          >
            <CopyIcon className="h-3 w-3 mr-1" />
            {copiedBlocks.has(blockIndex) ? 'Copied!' : 'Copy'}
          </Button>

          {isSql && onInsertSQL && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleInsert(code)}
              className="h-7 px-2 text-xs"
            >
              <PlayIcon className="h-3 w-3 mr-1" />
              Insert
            </Button>
          )}
        </div>

        <pre className="!mt-0">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  };

  return (
    <div className="flex items-start gap-3 mb-6">
      {/* Assistant Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <BotIcon className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Message Content */}
      <div className="flex-1 max-w-[85%]">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              code: CodeBlock,
              // Customize other elements as needed
              a: ({ node, ...props }) => (
                <a {...props} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" />
              ),
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-4">
                  <table {...props} className="border-collapse border border-border" />
                </div>
              ),
              th: ({ node, ...props }) => (
                <th {...props} className="border border-border px-3 py-2 bg-muted font-semibold" />
              ),
              td: ({ node, ...props }) => (
                <td {...props} className="border border-border px-3 py-2" />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
