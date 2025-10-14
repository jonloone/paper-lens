'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  ChevronDown,
  ChevronUp,
  Database,
  TrendingUp,
  Users,
  FileText,
  Lightbulb,
  Code2,
  Target,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  queryLivingContextGraph,
  getEnhancedChatContext,
  generateEvidenceText,
  type EnhancedChatContext
} from '@/lib/services/living-context-client';
import type { ChatAgentQueryResponse, DomainKnowledge } from '@/lib/types/living-context-graph';

interface ProductChatAgentProps {
  product: any;
}

// Domain-specific knowledge and capabilities
const getDomainContext = (domain: string) => {
  const contexts = {
    Customer: {
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      capabilities: [
        'Customer behavior analysis',
        'Segmentation queries',
        'Lifetime value calculations',
        'Churn prediction support'
      ],
      welcomeMessage: "I'm your Customer Domain expert. I can help you understand customer behavior, create segmentation queries, analyze lifetime value, and build predictive models.",
      suggestedQuestions: [
        'How do I calculate customer lifetime value?',
        'Show me a query for active customers',
        'What segmentation approaches are best?',
        'Help me analyze churn patterns',
        'How fresh is this customer data?',
        'What downstream models use this?'
      ]
    },
    Financial: {
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      capabilities: [
        'Revenue analysis',
        'Financial metrics',
        'Forecasting support',
        'Compliance guidance'
      ],
      welcomeMessage: "I'm your Financial Domain expert. I can help you analyze revenue, build financial models, create forecasts, and ensure compliance with financial reporting standards.",
      suggestedQuestions: [
        'How do I calculate MRR?',
        'Show me revenue by product',
        'Help with forecasting models',
        'What are the data quality rules?',
        'How often is this updated?',
        'Show me example queries'
      ]
    },
    Product: {
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      capabilities: [
        'Product analytics',
        'Feature adoption tracking',
        'Usage patterns',
        'A/B test analysis'
      ],
      welcomeMessage: "I'm your Product Domain expert. I can help you track feature adoption, analyze usage patterns, understand product performance, and design effective A/B tests.",
      suggestedQuestions: [
        'How do I track feature adoption?',
        'Show me active users query',
        'Help with funnel analysis',
        'What metrics are available?',
        'How to join with other tables?',
        'Explain the schema'
      ]
    },
    Marketing: {
      icon: Target,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      capabilities: [
        'Campaign performance',
        'Attribution modeling',
        'Audience segmentation',
        'ROI analysis'
      ],
      welcomeMessage: "I'm your Marketing Domain expert. I can help you analyze campaign performance, build attribution models, create audience segments, and calculate marketing ROI.",
      suggestedQuestions: [
        'How do I measure campaign ROI?',
        'Show me attribution query',
        'Help create audience segments',
        'What conversion metrics exist?',
        'How to track multi-touch attribution?',
        'Explain the data model'
      ]
    },
    Operations: {
      icon: Database,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      capabilities: [
        'Operational metrics',
        'Efficiency analysis',
        'Resource optimization',
        'Performance tracking'
      ],
      welcomeMessage: "I'm your Operations Domain expert. I can help you track operational metrics, analyze efficiency, optimize resources, and monitor system performance.",
      suggestedQuestions: [
        'How do I measure efficiency?',
        'Show me operational KPIs',
        'Help optimize resource usage',
        'What are key metrics?',
        'How to calculate throughput?',
        'Explain data lineage'
      ]
    }
  };

  return contexts[domain as keyof typeof contexts] || contexts.Customer;
};

// Generate domain-aware responses with LCG + OpenSPG context
const generateDomainResponse = async (
  question: string,
  product: any,
  lcgContext: EnhancedChatContext | null
): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  const domain = product.domain;
  const productName = product.displayName;

  // Build system prompt with domain knowledge from OpenSPG
  let domainExpertise = '';
  if (lcgContext?.domainExpertise) {
    const dk = lcgContext.domainExpertise;
    domainExpertise = `\n\n**Industry Knowledge (from OpenSPG)**:\n`;
    dk.keyMetrics.slice(0, 3).forEach(m => {
      domainExpertise += `• **${m.name}**: ${m.definition}\n`;
    });
  }

  // Get evidence text from LCG
  const evidenceText = lcgContext && lcgContext.hasEvidence
    ? `\n\n${generateEvidenceText(lcgContext)}`
    : '';

  // Calculate LTV
  if (question.toLowerCase().includes('lifetime value') || question.toLowerCase().includes('ltv')) {
    // Add common filters from usage patterns if available
    const commonFilters = lcgContext?.usageEvidence.commonFilters || [];
    const filterClause = commonFilters.length > 0
      ? `\n  AND ${commonFilters[0]}  -- Common filter (used by ${lcgContext?.usageEvidence.totalUsers || 0} analysts)`
      : '';

    return `Here's how to calculate Customer Lifetime Value using **${productName}**:

\`\`\`sql
SELECT
    customer_id,
    SUM(order_value) OVER (
        PARTITION BY customer_id
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as lifetime_value,
    COUNT(*) OVER (PARTITION BY customer_id) as total_orders,
    DATEDIFF(day, first_order_date, last_order_date) as customer_tenure_days
FROM ${productName}
WHERE order_status = 'completed'${filterClause}
GROUP BY customer_id
ORDER BY lifetime_value DESC;
\`\`\`
${domainExpertise}
${evidenceText}

**Key Metrics from this dataset:**
- Data Quality: ${product.quality.dataQuality}% ✅
- Freshness: ${product.sla.freshness} updates
- Active Users: ${product.usage.uniqueConsumers.toLocaleString()} analysts

**Related Glossary Terms:**
${product.businessContext.glossaryTerms.map((term: any) => `• ${term.name}`).join('\n')}

Would you like me to explain any specific part?`;
  }

  // Active customers query
  if (question.toLowerCase().includes('active customer')) {
    return `Here's a query to find active customers using **${productName}**:

\`\`\`sql
SELECT
    customer_id,
    email,
    last_activity_date,
    total_orders,
    lifetime_value,
    customer_segment
FROM ${productName}
WHERE
    last_activity_date >= CURRENT_DATE - INTERVAL '90 days'
    AND customer_status = 'active'
ORDER BY last_activity_date DESC
LIMIT 1000;
\`\`\`

**This query leverages:**
- Real-time freshness (${product.sla.freshness})
- ${product.quality.dataQuality}% data quality score
- Upstream from: ${product.dependencies.upstream.join(', ')}

**Performance Tips:**
- Add indexes on \`last_activity_date\` and \`customer_status\`
- Consider partitioning by month for large datasets
- Use materialized views for frequently accessed segments

Need help with a specific customer segment?`;
  }

  // Segmentation approaches
  if (question.toLowerCase().includes('segment')) {
    return `For customer segmentation with **${productName}**, I recommend these approaches:

**1. RFM Segmentation (Most Popular)**
- Recency: Days since last purchase
- Frequency: Number of purchases
- Monetary: Total spend

**2. Behavioral Segmentation**
- Product preferences
- Channel preferences
- Engagement patterns

**3. Predictive Segmentation**
- Churn risk score
- Lifetime value prediction
- Next-best-action models

**Available in ${productName}:**
${product.businessContext.glossaryTerms.map((term: any) => `✅ ${term.name}`).join('\n')}

**Common Use Cases:**
${product.businessContext.useCases.slice(0, 3).map((uc: string, i: number) => `${i + 1}. ${uc}`).join('\n')}

Which segmentation approach would you like to implement?`;
  }

  // Data freshness
  if (question.toLowerCase().includes('fresh') || question.toLowerCase().includes('updated')) {
    return `**${productName}** data freshness details:

**Update Frequency:** ${product.sla.freshness}
**Last Updated:** ${product.lastUpdated}
**SLA Uptime:** ${product.sla.uptime}% guaranteed
**Query Latency:** ${product.sla.latency}

**Upstream Dependencies:**
${product.dependencies.upstream.map((dep: string) => `• ${dep}`).join('\n')}

**Quality Metrics:**
- Data Quality Score: ${product.quality.dataQuality}%
- Documentation Coverage: ${product.quality.documentation}%
- Test Coverage: ${product.quality.testCoverage}%

**Downstream Impact:**
This dataset powers ${product.dependencies.downstream.length} downstream systems:
${product.dependencies.downstream.map((dep: string) => `• ${dep}`).join('\n')}

Need help understanding data flow or dependencies?`;
  }

  // Schema explanation
  if (question.toLowerCase().includes('schema') || question.toLowerCase().includes('explain the')) {
    return `Let me explain **${productName}**'s data model:

**Product Overview:**
${product.description}

**Key Concepts (${product.businessContext.glossaryTerms.length}):**
${product.businessContext.glossaryTerms.map((term: any) =>
  `• **${term.name}**: ${term.definition || 'Core business metric'}`
).join('\n')}

**Data Characteristics:**
- Row Count: ${product.profiling?.rowCount?.toLocaleString() || 'Millions'}
- Quality Score: ${product.profiling?.qualityScore || product.quality.dataQuality}%
- Update Frequency: ${product.sla.freshness}

**Common Access Patterns:**
${product.businessContext.useCases.slice(0, 2).map((uc: string, i: number) => `${i + 1}. ${uc}`).join('\n')}

**Used By:**
${product.businessContext.targetConsumers?.slice(0, 3).join(', ')}

Would you like to see example queries or dive into specific fields?`;
  }

  // Downstream usage
  if (question.toLowerCase().includes('downstream') || question.toLowerCase().includes('who uses')) {
    return `**${productName}** is used by ${product.dependencies.downstream.length} downstream systems:

**Direct Consumers:**
${product.dependencies.downstream.map((dep: string) => `• **${dep}**`).join('\n')}

**Team Usage:**
${product.businessContext.targetConsumers?.map((team: string) => `• ${team} team`).join('\n')}

**Usage Metrics:**
- Active Deployments: ${product.usage.deployments}
- Unique Consumers: ${product.usage.uniqueConsumers.toLocaleString()}
- Daily Queries: ${product.usage.queriesPerDay.toLocaleString()}

**Impact Analysis:**
Changes to this dataset will affect:
- ${product.dependencies.downstream.length} downstream pipelines
- ${product.usage.uniqueConsumers} daily users
- ${product.usage.deployments} production deployments

Need help understanding specific downstream dependencies or planning changes?`;
  }

  // Default response
  return `I'm the ${domain} domain expert for **${productName}**.

**About this dataset:**
${product.description}

**I can help you with:**
${getDomainContext(domain).capabilities.map((cap: string) => `• ${cap}`).join('\n')}

**Quick Stats:**
- Quality: ${product.quality.dataQuality}%
- Freshness: ${product.sla.freshness}
- Active Users: ${product.usage.uniqueConsumers.toLocaleString()}

**Popular Questions:**
${getDomainContext(domain).suggestedQuestions.slice(0, 3).map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

What would you like to know?`;
};

export function ProductChatAgent({ product }: ProductChatAgentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lcgContext, setLcgContext] = useState<EnhancedChatContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const context = getDomainContext(product.domain);
  const DomainIcon = context.icon;

  // Load Living Context Graph + OpenSPG context on mount
  useEffect(() => {
    async function loadEnhancedContext() {
      try {
        setIsLoadingContext(true);
        const enhancedContext = await getEnhancedChatContext(
          product.id,
          product.domain
        );
        setLcgContext(enhancedContext);
      } catch (error) {
        console.error('Failed to load enhanced context:', error);
        // Gracefully degrade - continue without LCG context
        setLcgContext(null);
      } finally {
        setIsLoadingContext(false);
      }
    }

    loadEnhancedContext();
  }, [product.id, product.domain]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSend = async (question: string) => {
    if (!question.trim()) return;

    const userMessage = { role: 'user' as const, content: question };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateDomainResponse(question, product, lcgContext);
      const assistantMessage = { role: 'assistant' as const, content: response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error processing your question. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!isExpanded) {
      setIsExpanded(true);
      setTimeout(() => handleSend(suggestion), 100);
    } else {
      handleSend(suggestion);
    }
  };

  return (
    <Card className="elevation-surface-1 border-primary/20">
      <CardContent className="p-0">
        {/* Header - Always Visible */}
        <div
          className="p-6 cursor-pointer hover:bg-muted/5 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className={cn("p-3 rounded-xl", context.bgColor)}>
                <DomainIcon className={cn("h-6 w-6", context.color)} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-xl font-semibold">Ask the {product.domain} Domain Expert</h3>
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI-Powered
                  </Badge>
                  {lcgContext && lcgContext.hasEvidence && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Database className="h-3 w-3" />
                      {lcgContext.usageEvidence.totalQueries} queries analyzed
                    </Badge>
                  )}
                  {lcgContext?.domainExpertise && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Lightbulb className="h-3 w-3" />
                      OpenSPG Enhanced
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {context.welcomeMessage}
                </p>

                {!isExpanded && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {context.suggestedQuestions.slice(0, 3).map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSuggestionClick(question);
                        }}
                        className="text-xs"
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Expanded Chat Interface */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-border/50"
            >
              {/* Capabilities Grid */}
              <div className="px-6 py-4 bg-muted/20 border-b border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  I can help with
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {context.capabilities.map((capability, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <Lightbulb className="h-3 w-3 text-primary flex-shrink-0" />
                      <span>{capability}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Messages Area */}
              <div className="px-6 py-4 space-y-4 max-h-[500px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Try asking me one of these questions:
                    </p>
                    <div className="grid gap-2">
                      {context.suggestedQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(question)}
                          className="text-left p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{question}</span>
                            <Send className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex",
                          message.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-xl px-4 py-3",
                            message.role === 'user'
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-2">
                              <DomainIcon className={cn("h-4 w-4", context.color)} />
                              <span className="text-xs font-medium">{product.domain} Expert</span>
                            </div>
                          )}
                          <div className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-xl px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Analyzing {product.domain.toLowerCase()} data...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="px-6 py-4 border-t border-border/50">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend(input);
                  }}
                  className="flex gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Ask me about ${product.displayName}...`}
                    className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    size="default"
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Ask
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
