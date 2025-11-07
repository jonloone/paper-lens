'use client';

import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
import { Domain } from '@/lib/data/tisql-domains';
import {
  Database,
  Users,
  DollarSign,
  Package,
  Megaphone,
  TrendingUp,
  Activity,
  Code
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DomainSelectorProps {
  selectedDomain: string;
  onDomainChange: (domainId: string) => void;
  domains: Domain[];
  className?: string;
  compact?: boolean;
  showIcon?: boolean;
}

// Map icon names to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Database,
  Users,
  DollarSign,
  Package,
  Megaphone,
  TrendingUp,
  Activity,
  Code
};

export function DomainSelector({
  selectedDomain,
  onDomainChange,
  domains,
  className,
  compact = false,
  showIcon = true
}: DomainSelectorProps) {
  // Get current domain
  const currentDomain = domains.find(d => d.id === selectedDomain);
  const IconComponent = currentDomain ? ICON_MAP[currentDomain.icon] : Database;

  // Convert domains to combobox options
  const options: ComboboxOption[] = domains.map(domain => ({
    value: domain.id,
    label: domain.name,
    // Store additional metadata for custom rendering if needed
    group: domain.id === 'all' ? 'All' : 'Domains'
  }));

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {!compact && (
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          Domain:
        </span>
      )}

      <div className="flex items-center gap-2">
        {/* Domain Icon */}
        {showIcon && currentDomain && IconComponent && (
          <div className={cn('flex-shrink-0', currentDomain.color)}>
            <IconComponent className="w-4 h-4" />
          </div>
        )}

        {/* Combobox Selector */}
        <Combobox
          options={options}
          value={selectedDomain}
          onValueChange={onDomainChange}
          placeholder="Select domain"
          searchPlaceholder="Search domains..."
          emptyText="No domains found"
          className="w-[180px]"
          disabled={false}
        />

        {/* Metadata Badge */}
        {!compact && currentDomain && currentDomain.id !== 'all' && (
          <Badge variant="secondary" className="text-xs whitespace-nowrap">
            {currentDomain.tableCount} tables • {currentDomain.dataProductCount} products
          </Badge>
        )}
      </div>
    </div>
  );
}

/**
 * Domain info tooltip component (optional enhancement)
 */
export function DomainInfo({ domain }: { domain: Domain }) {
  const IconComponent = ICON_MAP[domain.icon];

  return (
    <div className="space-y-3 p-1">
      {/* Header */}
      <div className="flex items-center gap-2">
        {IconComponent && (
          <div className={cn('flex-shrink-0', domain.color)}>
            <IconComponent className="w-5 h-5" />
          </div>
        )}
        <div>
          <h4 className="font-semibold text-sm">{domain.name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {domain.description}
          </p>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2 text-xs">
        <Badge variant="secondary">
          {domain.tableCount} tables
        </Badge>
        <Badge variant="secondary">
          {domain.dataProductCount} products
        </Badge>
      </div>

      {/* Key Metrics */}
      {domain.keyMetrics && domain.keyMetrics.length > 0 && domain.id !== 'all' && (
        <div>
          <p className="text-xs font-medium mb-1">Key Metrics:</p>
          <div className="flex flex-wrap gap-1">
            {domain.keyMetrics.slice(0, 4).map(metric => (
              <Badge key={metric} variant="outline" className="text-xs">
                {metric}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Common Queries (first 2) */}
      {domain.commonQueries && domain.commonQueries.length > 0 && domain.id !== 'all' && (
        <div>
          <p className="text-xs font-medium mb-1">Example Queries:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {domain.commonQueries.slice(0, 2).map((query, idx) => (
              <li key={idx} className="line-clamp-1">• {query}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
