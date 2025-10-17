'use client';

import { UserIcon } from 'lucide-react';
import type { Message } from './types';

export interface UserMessageProps {
  message: Message;
}

/**
 * UserMessage - Displays user message in chat
 *
 * Design:
 * - Right-aligned message bubble
 * - User avatar icon
 * - Simple text display (no markdown needed)
 */
export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex items-start justify-end gap-3 mb-6">
      {/* Message Content */}
      <div className="max-w-[80%] px-4 py-3 bg-primary text-primary-foreground rounded-2xl rounded-tr-sm">
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>

      {/* User Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
        <UserIcon className="h-4 w-4 text-primary-foreground" />
      </div>
    </div>
  );
}
