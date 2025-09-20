'use client';

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Command, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CommandBarProps {
  variant?: 'default' | 'compact';
}

export function CommandBar({ variant = 'default' }: CommandBarProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/query?q=${encodeURIComponent(query)}`);
    }
  };
  
  if (variant === 'compact') {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search data, write SQL, or describe what you need..."
                className="pl-10 pr-24 h-9 text-sm"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-muted/50 rounded border border-border/50">
                  <Command className="h-2.5 w-2.5 inline" />K
                </kbd>
              </div>
            </div>
            <Button type="submit" size="sm" className="h-9">
              <Sparkles className="h-3 w-3 mr-1" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search data, write SQL, or describe what you need..."
              className="pl-12 pr-32 h-12 text-base"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <kbd className="px-2 py-1 text-xs bg-muted/50 rounded border border-border/50">
                <Command className="h-3 w-3 inline" />K
              </kbd>
              <Button type="submit" size="sm">
                <Sparkles className="h-4 w-4 mr-1" />
                Search
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}