/**
 * Draft Card Component
 *
 * Enhanced card for displaying draft metadata in gallery:
 * - Progress indicator with completion percentage
 * - Quick stats (sources, quality rules, SQL status, schedule)
 * - Blocker warnings
 * - Next step hint
 * - Preview button
 */

'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Draft } from '@/lib/services/draft-autosave';
import { BookMarked, Database, Shield, Code, Clock, ArrowRight, AlertCircle } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface DraftCardProps {
  draft: Draft;
  onClick: () => void;
}

// ============================================================================
// Draft Card Component
// ============================================================================

export function DraftCard({ draft, onClick }: DraftCardProps) {
  return (
    <Card
      className="p-5 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50 bg-elevation-1"
      onClick={onClick}
    >
      {/* Header with icon and title */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <BookMarked className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold line-clamp-1 mb-1">
            {draft.productData.name || 'Untitled Draft'}
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-muted-foreground">
              Saved {draft.lastModified}
            </p>
            {draft.blockers.length > 0 && (
              <Badge variant="destructive" className="text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {draft.blockers.length} blocker{draft.blockers.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">{draft.progress}%</span>
        </div>
        <Progress value={draft.progress} className="h-2" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Database className="w-3 h-3" />
          <span>
            {draft.productData.selectedSources?.length || 0} source{draft.productData.selectedSources?.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Shield className="w-3 h-3" />
          <span>
            {(draft.productData.customQualityRules?.length || 0) + (draft.productData.qualityRules?.length || 0)} rule{((draft.productData.customQualityRules?.length || 0) + (draft.productData.qualityRules?.length || 0)) === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Code className="w-3 h-3" />
          <span>{draft.productData.sql ? 'SQL written' : 'No SQL'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{draft.productData.schedule ? 'Scheduled' : 'Not scheduled'}</span>
        </div>
      </div>

      {/* Next Step Hint */}
      {draft.nextSteps.length > 0 && (
        <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs text-blue-800 dark:text-blue-200 mb-4">
          <span className="font-medium">Next:</span> {draft.nextSteps[0]}
        </div>
      )}

      {/* Load Button */}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        Continue Building
        <ArrowRight className="w-4 h-4" />
      </Button>
    </Card>
  );
}
