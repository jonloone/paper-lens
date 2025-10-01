"use client"

import React, { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  Bot,
  Send,
  X,
  Sparkles,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Database,
  GitBranch,
  Hammer,
  Shield,
} from "lucide-react"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  confidence?: number
}

interface AIContext {
  mode: string
  title: string
  description: string
  suggestions: string[]
  contextData?: any
}

export function AIAssistant() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [aiContext, setAIContext] = useState<AIContext | null>(null)
  const isWin98 = theme === 'win98'
  
  // Update AI context based on current page
  useEffect(() => {
    const primarySection = '/' + pathname.split('/')[1]
    
    let context: AIContext = {
      mode: 'general',
      title: 'AI Assistant',
      description: 'How can I help you?',
      suggestions: [
        "What's the system status?",
        "Help me build a pipeline",
        "Show recent incidents"
      ]
    }
    
    if (primarySection === '/monitor') {
      context = {
        mode: 'monitor',
        title: 'Monitor Assistant',
        description: 'AI help for system monitoring',
        suggestions: [
          "Why is Inventory Sync pipeline failing?",
          "Show me pipeline dependencies",
          "What's causing the performance degradation?",
          "Analyze recent incidents"
        ],
        contextData: {
          failedPipelines: 2,
          degradedSystems: 1,
          activeIncidents: 3
        }
      }
    } else if (primarySection === '/build') {
      context = {
        mode: 'build',
        title: 'Build Assistant',
        description: 'AI help for pipeline development',
        suggestions: [
          "Help me optimize this query",
          "Suggest a pattern for customer data",
          "Review my pipeline design",
          "Create a data quality check"
        ]
      }
    } else if (primarySection === '/connections') {
      context = {
        mode: 'connections',
        title: 'Connection Assistant',
        description: 'AI help for data connections',
        suggestions: [
          "Troubleshoot connection issues",
          "Optimize connection pooling",
          "Check authentication settings",
          "Monitor connection health"
        ]
      }
    } else if (primarySection === '/products') {
      context = {
        mode: 'products',
        title: 'Product Assistant',
        description: 'AI help for data products',
        suggestions: [
          "Create a new data product",
          "Set quality standards",
          "Configure access control",
          "Analyze product usage"
        ]
      }
    }
    
    setAIContext(context)
  }, [pathname])
  
  const handleSend = async () => {
    if (!input.trim()) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true)
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateContextualResponse(input, aiContext?.mode || 'general'),
        timestamp: new Date(),
        confidence: 85
      }
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }
  
  const generateContextualResponse = (query: string, mode: string): string => {
    const lowerQuery = query.toLowerCase()
    
    if (mode === 'monitor') {
      if (lowerQuery.includes('inventory sync') || lowerQuery.includes('failing')) {
        return `I've analyzed the Inventory Sync pipeline failure:

🔍 **Root Cause** (85% confidence):
• Java heap space exhaustion in the processing step
• Dataset size increased by 40% causing Spark executor OOM
• Similar pattern detected 2 weeks ago

🛠️ **Recommended Actions**:
1. **Immediate**: Increase executor memory to 4GB
2. **Investigation**: Check for data volume spike in source system  
3. **Long-term**: Implement dynamic partitioning based on input size

⚠️ **Impact**:
• 3 downstream systems blocked
• Executive Dashboard delayed
• Stock prediction queries affected

Would you like me to apply the memory fix or investigate the data volume spike?`
      }
      
      if (lowerQuery.includes('performance') || lowerQuery.includes('degradation')) {
        return `Performance analysis shows:

📊 **Current Issues**:
• Customer ETL running 2x slower than baseline
• Memory usage at 87% across Spark cluster
• Network latency increased by 150ms

🎯 **Optimization Opportunities**:
1. Enable adaptive query execution in Spark
2. Increase partition count for large datasets
3. Consider caching frequently accessed tables

Should I generate an optimization plan?`
      }
    }
    
    if (mode === 'build') {
      if (lowerQuery.includes('optimize') || lowerQuery.includes('query')) {
        return `I can help optimize your query! Based on common patterns:

📝 **Query Optimization Tips**:
• Use partition pruning for date filters
• Replace SELECT * with specific columns
• Consider using broadcast joins for small tables
• Add statistics collection for better plans

Would you like me to analyze a specific query?`
      }
      
      if (lowerQuery.includes('pattern') || lowerQuery.includes('customer')) {
        return `Here's a recommended pattern for customer data:

📋 **Customer ETL Pattern v2.1**:
• Used successfully in 8 pipelines
• Handles deduplication and PII masking
• Includes quality checks and monitoring
• Average setup time: 2 hours

**Key Features**:
✅ CDC support for real-time updates
✅ SCD Type 2 for history tracking
✅ Built-in data quality validation
✅ Automatic schema evolution

Would you like me to create this pipeline?`
      }
    }
    
    // Default response
    return `I understand you're asking about "${query}". Let me help you with that.

Based on the current context, I can:
• Provide detailed analysis
• Suggest optimizations
• Help troubleshoot issues
• Generate recommendations

What specific aspect would you like to explore?`
  }
  
  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion)
    handleSend()
  }
  
  return (
    <>
      {/* Floating Chat Button */}
      <Button
        className={cn(
          "fixed bottom-6 right-6 shadow-lg",
          "bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200",
          "z-50",
          isWin98 ? "h-10 w-auto px-4 rounded-none win98-flat" : "h-14 w-14 rounded-full hover:scale-110"
        )}
        onClick={() => setIsOpen(true)}
      >
        {isWin98 ? (
          <>
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>AI Assistant</span>
          </>
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
        {aiContext?.contextData?.activeIncidents > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center">
              {aiContext.contextData.activeIncidents}
            </span>
          </span>
        )}
      </Button>
      
      {/* Chat Interface */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side={isWin98 ? "bottom" : "right"}
          className={cn(
            "p-0 flex flex-col",
            isWin98
              ? "w-full h-[400px] win98-window border-t-[3px] border-l-[3px] border-r-[3px] bottom-0"
              : "w-[400px] sm:w-[540px]"
          )}
        >
          <SheetHeader className={cn(
            "border-b",
            isWin98 ? "win98-titlebar px-2 py-1" : "px-6 py-4"
          )}>
            {isWin98 ? (
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-[11px]">
                  {aiContext?.title || "AI Assistant"} - NexusOne
                </span>
                <div className="flex gap-1">
                  <button
                    className="win98-flat w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-black text-[10px] font-bold"
                    onClick={() => setIsOpen(false)}
                  >
                    _
                  </button>
                  <button
                    className="win98-flat w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-black text-[10px] font-bold"
                    onClick={() => setIsOpen(false)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <SheetTitle className="text-base">{aiContext?.title}</SheetTitle>
                    <SheetDescription className="text-xs">
                      {aiContext?.description}
                    </SheetDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              </div>
            )}
          </SheetHeader>
          
          <div className="flex-1 flex flex-col">
            {/* Suggestions */}
            {messages.length === 0 && aiContext && (
              <div className="p-4 border-b bg-muted/30">
                <p className="text-sm font-medium mb-2">Suggested questions:</p>
                <div className="space-y-1">
                  {aiContext.suggestions.map((suggestion, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left text-xs h-auto py-2"
                      onClick={() => handleSuggestion(suggestion)}
                    >
                      <Sparkles className="h-3 w-3 mr-2 shrink-0 text-primary" />
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' && "justify-end"
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-3",
                        message.role === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      {message.confidence && (
                        <div className="mt-2 flex items-center gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {message.confidence}% confidence
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="h-2 w-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="h-2 w-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder={`Ask about ${aiContext?.mode === 'monitor' ? 'pipeline issues' : aiContext?.mode === 'build' ? 'pipeline development' : 'anything'}...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1"
                />
                <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Powered by CrewAI + Arbitron consensus intelligence
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}