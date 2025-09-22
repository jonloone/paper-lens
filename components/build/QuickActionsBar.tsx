'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { UnifiedIcon } from '@/components/ui/unified-icon';
import { Badge } from '@/components/ui/badge';

interface QuickActionsBarProps {
  onManageDomains: () => void;
  onDomainAnalytics: () => void;
  onTeamAssignment: () => void;
  onCreateNewDomain: () => void;
  onBrowsePatterns: () => void;
  onConnectSource: () => void;
}

export function QuickActionsBar({
  onManageDomains,
  onDomainAnalytics,
  onTeamAssignment,
  onCreateNewDomain,
  onBrowsePatterns,
  onConnectSource
}: QuickActionsBarProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/40">
      {/* Domain Configuration Actions */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Domain Configuration:</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onManageDomains}
          className="gap-2"
        >
          <UnifiedIcon name="Settings" className="h-4 w-4" />
          Manage Domains
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDomainAnalytics}
          className="gap-2"
        >
          <UnifiedIcon name="BarChart3" className="h-4 w-4" />
          Domain Analytics
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onTeamAssignment}
          className="gap-2"
        >
          <UnifiedIcon name="Users" className="h-4 w-4" />
          Team Assignment
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateNewDomain}
          className="gap-2"
        >
          <UnifiedIcon name="Plus" className="h-4 w-4" />
          Create New Domain
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onBrowsePatterns}
          className="gap-2"
        >
          <UnifiedIcon name="Package" className="h-4 w-4" />
          Browse All Patterns
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onConnectSource}
          className="gap-2"
        >
          <UnifiedIcon name="Cable" className="h-4 w-4" />
          Connect New Source
        </Button>
      </div>
    </div>
  );
}