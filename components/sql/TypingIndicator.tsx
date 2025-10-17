'use client';

import { BotIcon } from 'lucide-react';

/**
 * TypingIndicator - Shows animated dots while AI is responding
 *
 * Design:
 * - Matches assistant message layout
 * - Three animated dots
 * - Subtle pulsing animation
 */
export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 mb-6">
      {/* Assistant Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <BotIcon className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Typing Animation */}
      <div className="flex items-center gap-1 px-4 py-3 bg-muted rounded-2xl rounded-tl-sm">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
