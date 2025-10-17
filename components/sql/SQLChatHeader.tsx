'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrashIcon,
  DatabaseIcon,
  TableIcon,
  Sparkles,
} from 'lucide-react';
import type { SQLContext } from './types';

export interface SQLChatHeaderProps {
  context: SQLContext;
  onClearChat?: () => void;
}

/**
 * SQLChatHeader - Header for SQL chat panel
 *
 * Displays:
 * - Current context (catalog, schema, selected tables)
 * - AI badge (always using best model via CrewAI)
 * - Clear chat button
 */
export function SQLChatHeader({
  context,
  onClearChat,
}: SQLChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
      {/* Left: Context Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-mono text-foreground">
            {context.catalog}.{context.schema}
          </span>
        </div>

        {context.selectedTables.length > 0 && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">
                {context.selectedTables.length} {context.selectedTables.length === 1 ? 'table' : 'tables'}
              </Badge>
            </div>
          </>
        )}

        {context.environment && (
          <>
            <div className="h-4 w-px bg-border" />
            <Badge
              variant={context.environment === 'production' ? 'destructive' : 'outline'}
              className="text-xs"
            >
              {context.environment}
            </Badge>
          </>
        )}
      </div>

      {/* Right: AI Badge + Clear Button */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs gap-1.5">
          <Sparkles className="h-3 w-3" />
          AI-Powered
        </Badge>

        {onClearChat && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearChat}
            className="h-8 w-8 p-0"
            title="Clear chat"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
