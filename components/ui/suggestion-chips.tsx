"use client"

import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

interface SuggestionChipsProps {
  suggestions: string[]
  onSuggestionClick: (suggestion: string) => void
  disabled?: boolean
}

/**
 * SuggestionChips Component
 *
 * Displays clickable suggestion chips for progressive disclosure in AI chat.
 * Used to guide users to explore specific aspects of the analysis.
 */
export function SuggestionChips({
  suggestions,
  onSuggestionClick,
  disabled = false
}: SuggestionChipsProps) {
  if (!suggestions || suggestions.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3 mb-2">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSuggestionClick(suggestion)}
          disabled={disabled}
          className="h-auto py-1.5 px-3 text-xs font-normal border-accent/20 bg-background/50 hover:bg-accent/10 hover:border-accent/40 transition-all"
        >
          <Sparkles className="w-3 h-3 mr-1.5 text-accent opacity-70" />
          {suggestion}
        </Button>
      ))}
    </div>
  )
}
