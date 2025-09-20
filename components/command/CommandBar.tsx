'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Search, ArrowRight } from 'lucide-react';

interface CommandBarProps {
  onSQLDetected: (sql: string) => void;
  onSearch: (query: string) => void;
  onNaturalLanguage: (text: string) => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  onSQLDetected,
  onSearch,
  onNaturalLanguage
}) => {
  const [value, setValue] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [recentQueries, setRecentQueries] = useState<Array<{
    name: string;
    time: string;
  }>>([
    { name: 'customer_analytics', time: '2 hours ago' },
    { name: 'revenue_forecast', time: 'yesterday' },
    { name: 'product_metrics', time: '2 days ago' }
  ]);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus command bar on / key press
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const detectInputType = (input: string): 'sql' | 'search' | 'natural' => {
    const sqlKeywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'GROUP BY', 'ORDER BY', 'WITH'];
    const upperInput = input.toUpperCase();
    
    // Check if it starts with SQL keywords
    if (sqlKeywords.some(keyword => upperInput.startsWith(keyword))) {
      return 'sql';
    }
    
    // Check if it contains table/column references (dots)
    if (input.includes('.') && input.split(' ').length < 5) {
      return 'search';
    }
    
    // Default to natural language
    return 'natural';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    
    const inputType = detectInputType(value);
    
    switch (inputType) {
      case 'sql':
        onSQLDetected(value);
        break;
      case 'search':
        onSearch(value);
        break;
      case 'natural':
        onNaturalLanguage(value);
        break;
    }
  };

  const handleRecentClick = (queryName: string) => {
    onSearch(queryName);
  };

  return (
    <div className="relative w-full">
      {/* Main Command Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsActive(true)}
          onBlur={() => setTimeout(() => setIsActive(false), 200)}
          placeholder="Type to search data, write SQL, or describe what you need..."
          className={cn(
            "w-full px-4 py-4 text-base bg-transparent",
            "border-0 border-b border-border/50",
            "focus:outline-none focus:border-border",
            "placeholder:text-muted-foreground/60",
            "transition-colors"
          )}
        />
        
        {/* Keyboard Hint */}
        {!value && !isActive && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 bg-muted/50 rounded border border-border/50">/</kbd>
            <span>to focus</span>
          </div>
        )}
        
        {/* Input Type Indicator */}
        {value && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {detectInputType(value) === 'sql' && (
              <span className="text-xs text-blue-500 font-medium">SQL</span>
            )}
            {detectInputType(value) === 'search' && (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
            {detectInputType(value) === 'natural' && (
              <span className="text-xs text-green-500 font-medium">AI</span>
            )}
            <button
              type="submit"
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </form>
      
      {/* Recent Queries - Only show when focused and no input */}
      {isActive && !value && (
        <div className="absolute top-full left-0 right-0 mt-px bg-background border border-border rounded-b-lg shadow-lg z-50">
          <div className="p-4">
            <div className="text-xs font-medium text-muted-foreground mb-3">Recent</div>
            <div className="space-y-1">
              {recentQueries.map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRecentClick(query.name)}
                  className="w-full flex items-center justify-between p-2 hover:bg-muted/50 rounded transition-colors text-left"
                >
                  <span className="text-sm">{query.name}</span>
                  <span className="text-xs text-muted-foreground">{query.time}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};