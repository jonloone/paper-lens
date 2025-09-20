'use client';

import { useState, useEffect } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { 
  FileIcon,
  PlayIcon,
  BarChart3Icon,
  SparklesIcon,
  DatabaseIcon,
  RefreshCwIcon,
  DownloadIcon,
  SearchIcon,
  PlusIcon,
  SaveIcon,
  ShareIcon,
  SettingsIcon,
  HelpCircleIcon,
  GitBranchIcon
} from 'lucide-react';

interface Pattern {
  id: string;
  name: string;
  description: string;
  category: string;
  uses: number;
  confidence: number;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPattern: (pattern: Pattern) => void;
  onRunPattern: () => void;
  onSavePattern: () => void;
  onOpenMetrics: () => void;
  onOpenAI: () => void;
  onAddNode: (type: 'source' | 'transform' | 'sink') => void;
}

const patterns: Pattern[] = [
  {
    id: 'incremental-load',
    name: 'Incremental Load',
    description: 'Efficiently load only changed data using timestamp watermarks',
    category: 'Data Integration',
    uses: 156,
    confidence: 94
  },
  {
    id: 'retry-backoff',
    name: 'Retry with Backoff',
    description: 'Robust error handling with exponential backoff',
    category: 'Reliability',
    uses: 89,
    confidence: 91
  },
  {
    id: 'partitioned-processing',
    name: 'Partitioned Processing',
    description: 'Process data in parallel partitions for scalability',
    category: 'Performance',
    uses: 234,
    confidence: 96
  },
  {
    id: 'schema-evolution',
    name: 'Schema Evolution',
    description: 'Handle schema changes gracefully over time',
    category: 'Data Management',
    uses: 67,
    confidence: 88
  },
  {
    id: 'cdc-pattern',
    name: 'Change Data Capture',
    description: 'Real-time data synchronization using CDC',
    category: 'Real-time',
    uses: 143,
    confidence: 93
  },
  {
    id: 'deduplication',
    name: 'Data Deduplication',
    description: 'Remove duplicate records using various strategies',
    category: 'Data Quality',
    uses: 98,
    confidence: 89
  }
];

export function CommandPalette({
  open,
  onOpenChange,
  onSelectPattern,
  onRunPattern,
  onSavePattern,
  onOpenMetrics,
  onOpenAI,
  onAddNode
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');

  // Filter patterns based on search
  const filteredPatterns = patterns.filter(pattern =>
    pattern.name.toLowerCase().includes(search.toLowerCase()) ||
    pattern.description.toLowerCase().includes(search.toLowerCase()) ||
    pattern.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group patterns by category
  const patternsByCategory = filteredPatterns.reduce((acc, pattern) => {
    if (!acc[pattern.category]) {
      acc[pattern.category] = [];
    }
    acc[pattern.category].push(pattern);
    return acc;
  }, {} as Record<string, Pattern[]>);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search patterns, run commands, or ask AI..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Quick Actions */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={onRunPattern}>
            <PlayIcon className="mr-2 h-4 w-4" />
            <span>Run Pattern</span>
            <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Ctrl+R</kbd>
          </CommandItem>
          <CommandItem onSelect={onSavePattern}>
            <SaveIcon className="mr-2 h-4 w-4" />
            <span>Save Pattern</span>
            <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Ctrl+S</kbd>
          </CommandItem>
          <CommandItem onSelect={onOpenMetrics}>
            <BarChart3Icon className="mr-2 h-4 w-4" />
            <span>View Metrics</span>
            <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Ctrl+M</kbd>
          </CommandItem>
        </CommandGroup>

        {/* Add Nodes */}
        <CommandGroup heading="Add Node">
          <CommandItem onSelect={() => onAddNode('source')}>
            <DatabaseIcon className="mr-2 h-4 w-4 text-blue-500" />
            <span>Add Source Node</span>
          </CommandItem>
          <CommandItem onSelect={() => onAddNode('transform')}>
            <RefreshCwIcon className="mr-2 h-4 w-4 text-green-500" />
            <span>Add Transform Node</span>
          </CommandItem>
          <CommandItem onSelect={() => onAddNode('sink')}>
            <DownloadIcon className="mr-2 h-4 w-4 text-purple-500" />
            <span>Add Sink Node</span>
          </CommandItem>
        </CommandGroup>

        {/* Pattern Library */}
        {Object.entries(patternsByCategory).map(([category, categoryPatterns]) => (
          <CommandGroup key={category} heading={category}>
            {categoryPatterns.map((pattern) => (
              <CommandItem
                key={pattern.id}
                onSelect={() => onSelectPattern(pattern)}
              >
                <FileIcon className="mr-2 h-4 w-4" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span>{pattern.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {pattern.uses} uses
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {pattern.confidence}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {pattern.description}
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        {/* AI Assistant */}
        <CommandGroup heading="AI Assistant">
          <CommandItem onSelect={onOpenAI}>
            <SparklesIcon className="mr-2 h-4 w-4" />
            <span>Ask AI for suggestions</span>
            <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Ctrl+/</kbd>
          </CommandItem>
          <CommandItem onSelect={() => onOpenAI()}>
            <SparklesIcon className="mr-2 h-4 w-4" />
            <span>Optimize current pattern</span>
          </CommandItem>
          <CommandItem onSelect={() => onOpenAI()}>
            <SparklesIcon className="mr-2 h-4 w-4" />
            <span>Explain pattern logic</span>
          </CommandItem>
        </CommandGroup>

        {/* Help */}
        <CommandGroup heading="Help">
          <CommandItem>
            <HelpCircleIcon className="mr-2 h-4 w-4" />
            <span>Keyboard shortcuts</span>
          </CommandItem>
          <CommandItem>
            <GitBranchIcon className="mr-2 h-4 w-4" />
            <span>Pattern documentation</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}