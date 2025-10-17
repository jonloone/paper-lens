'use client';

import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendIcon, StopCircleIcon } from 'lucide-react';

export interface SQLChatInputProps {
  input: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onStop?: () => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * SQLChatInput - Input area for SQL chat
 *
 * Features:
 * - Auto-expanding textarea (up to 200px)
 * - Submit on Enter (Shift+Enter for newline)
 * - Stop button when loading
 * - Disabled state during generation
 */
export function SQLChatInput({
  input,
  onChange,
  onSubmit,
  onStop,
  isLoading,
  placeholder = 'Ask me anything about SQL...',
  disabled = false,
}: SQLChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [rows, setRows] = useState(1);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = 24; // Approximate line height
      const maxRows = 8;
      const newRows = Math.min(Math.ceil(scrollHeight / lineHeight), maxRows);
      setRows(newRows);
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input?.trim() && !isLoading) {
        onSubmit(e as any);
      }
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input?.trim() && !isLoading) {
      onSubmit(e);
      setRows(1); // Reset height after submit
    }
  };

  return (
    <div className="px-6 py-4 border-t border-border bg-card">
      <form onSubmit={handleSubmit} className="relative">
        <Textarea
          ref={textareaRef}
          value={input || ''}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={rows}
          className="min-h-[44px] max-h-[200px] pr-12 resize-none"
        />

        <div className="absolute right-2 bottom-2">
          {isLoading && onStop ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onStop}
              className="h-8 w-8 p-0"
              title="Stop generation"
            >
              <StopCircleIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              disabled={!input?.trim() || isLoading || disabled}
              className="h-8 w-8 p-0"
              title="Send message (Enter)"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      <div className="mt-2 text-xs text-muted-foreground text-center">
        Press <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-muted rounded">Shift+Enter</kbd> for new line
      </div>
    </div>
  );
}
