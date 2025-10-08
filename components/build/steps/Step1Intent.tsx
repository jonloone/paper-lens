'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Building2, Users, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { suggestContracts, ContractMatch } from '@/lib/services/contract-suggestion';
import { ODCSContract } from '@/lib/schemas/odcs-contract';

export interface Step1Data {
  description: string;
  domain: string;
  owner: string;
  selectedContract?: ODCSContract;
}

interface Step1IntentProps {
  initialData?: Partial<Step1Data>;
  onComplete: (data: Step1Data) => void;
}

// Mock data - in production, these would come from API
const domainOptions: ComboboxOption[] = [
  // Core Business Domains
  { value: 'sales', label: 'Sales', group: 'Core Business' },
  { value: 'marketing', label: 'Marketing', group: 'Core Business' },
  { value: 'finance', label: 'Finance', group: 'Core Business' },
  { value: 'product', label: 'Product', group: 'Core Business' },
  { value: 'customer-success', label: 'Customer Success', group: 'Core Business' },
  { value: 'operations', label: 'Operations', group: 'Core Business' },
  { value: 'supply-chain', label: 'Supply Chain', group: 'Core Business' },
  { value: 'human-resources', label: 'Human Resources', group: 'Core Business' },

  // Technology Domains
  { value: 'engineering', label: 'Engineering', group: 'Technology' },
  { value: 'data', label: 'Data & Analytics', group: 'Technology' },
  { value: 'security', label: 'Security & Compliance', group: 'Technology' },
  { value: 'infrastructure', label: 'Infrastructure', group: 'Technology' },

  // Functional Domains
  { value: 'risk', label: 'Risk Management', group: 'Functional' },
  { value: 'compliance', label: 'Compliance', group: 'Functional' },
  { value: 'legal', label: 'Legal', group: 'Functional' },
  { value: 'procurement', label: 'Procurement', group: 'Functional' },
];

const ownerOptions: ComboboxOption[] = [
  // Recently Used
  { value: 'analytics-team', label: 'Analytics Team', group: 'Recently Used' },
  { value: 'data-platform', label: 'Data Platform Team', group: 'Recently Used' },
  { value: 'data-engineering', label: 'Data Engineering Team', group: 'Recently Used' },

  // Data Teams
  { value: 'ml-team', label: 'ML Engineering Team', group: 'Data Teams' },
  { value: 'business-intelligence', label: 'Business Intelligence Team', group: 'Data Teams' },
  { value: 'product-analytics', label: 'Product Analytics Team', group: 'Data Teams' },
  { value: 'data-science', label: 'Data Science Team', group: 'Data Teams' },
  { value: 'data-governance', label: 'Data Governance Team', group: 'Data Teams' },

  // Business Teams
  { value: 'sales-ops', label: 'Sales Operations Team', group: 'Business Teams' },
  { value: 'marketing-analytics', label: 'Marketing Analytics Team', group: 'Business Teams' },
  { value: 'finance-analytics', label: 'Finance Analytics Team', group: 'Business Teams' },
  { value: 'customer-insights', label: 'Customer Insights Team', group: 'Business Teams' },
  { value: 'product-team', label: 'Product Team', group: 'Business Teams' },

  // Platform Teams
  { value: 'platform-engineering', label: 'Platform Engineering Team', group: 'Platform Teams' },
  { value: 'cloud-infrastructure', label: 'Cloud Infrastructure Team', group: 'Platform Teams' },
  { value: 'devops', label: 'DevOps Team', group: 'Platform Teams' },
];

export function Step1Intent({ initialData, onComplete }: Step1IntentProps) {
  const [description, setDescription] = useState(initialData?.description || '');
  const [domain, setDomain] = useState(initialData?.domain || '');
  const [owner, setOwner] = useState(initialData?.owner || '');
  const [suggestions, setSuggestions] = useState<ContractMatch[]>([]);
  const [selectedContract, setSelectedContract] = useState<ODCSContract | undefined>(initialData?.selectedContract);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Keyword-based contract suggestion (Phase 1: Simple approach)
  // Future: Replace with ML/vector search when pattern library grows
  useEffect(() => {
    if (description.trim().length < 10) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        // Phase 1: Simple keyword extraction and matching
        // This queries existing ODCS contracts in our catalog by keywords
        const result = await suggestContracts(description);
        setSuggestions(result.matches);

        // Auto-suggest domain from matched patterns
        if (result.suggestedDomain && !domain) {
          setDomain(result.suggestedDomain);
        }
      } catch (error) {
        console.error('Failed to fetch contract suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [description, domain]);

  const isValid = description.trim() !== '' && domain !== '' && owner !== '';

  const handleSelectContract = (contract: ODCSContract) => {
    setSelectedContract(contract);
    // Pre-populate domain and owner from contract
    if (contract.metadata.domain) {
      setDomain(contract.metadata.domain);
    }
    if (contract.owner.team) {
      setOwner(contract.owner.team.toLowerCase().replace(/\s+/g, '-'));
    }
  };

  const handleContinue = () => {
    if (isValid) {
      onComplete({ description, domain, owner, selectedContract });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      {/* Header - Outside card for clear hierarchy */}
      <div className="space-y-2">
        <h2 className="text-3xl font-display tracking-tight">What data product do you need?</h2>
        <p className="text-muted-foreground text-base">
          Tell us what you're trying to analyze or report on, and we'll help you build it
        </p>
      </div>

      {/* Primary Intent Card - Clean, focused */}
      <Card className="border-2 shadow-lg">
        <div className="p-8 space-y-4">
          <Label htmlFor="description" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Describe your analytical need *
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="I need a weekly report showing customer purchase behavior - combining orders, website activity, and support interactions to understand retention patterns..."
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            We'll help you find the right data and set everything up
          </p>
        </div>
      </Card>

      {/* Smart Suggestions */}
      {(isLoadingSuggestions || suggestions.length > 0) && (
        <Card className="p-6 space-y-4 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">We found similar data products</h3>
          </div>

          {isLoadingSuggestions ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((match, index) => (
                <Card
                  key={match.contract.name}
                  className={`p-4 transition-all hover:shadow-md ${
                    selectedContract?.name === match.contract.name
                      ? 'border-2 border-primary bg-primary/5'
                      : 'border border-border'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-base">{match.contract.metadata.business_context}</h4>
                          {match.matchScore > 70 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-700 dark:text-green-300">
                              {match.matchScore}% match
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Match Reasons */}
                    {match.matchReasons.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {match.matchReasons.map((reason, i) => (
                          <span key={i} className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded">
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Usage Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{match.usageStats.teamsUsing} teams using this</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>{match.usageStats.qualityScore}% quality</span>
                      </div>
                      <div className="text-xs">
                        Last validated {match.usageStats.lastUpdated}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-start justify-between gap-4 pt-2">
                      <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                        This will pre-fill schema fields, quality checks, and update schedules based on this pattern
                      </p>

                      {/* Action Button */}
                      <Button
                        size="sm"
                        onClick={() => handleSelectContract(match.contract)}
                        variant={selectedContract?.name === match.contract.name ? 'secondary' : 'default'}
                        className="flex-shrink-0"
                      >
                        {selectedContract?.name === match.contract.name ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Selected
                          </>
                        ) : (
                          <>
                            Start from this
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!isLoadingSuggestions && suggestions.length === 0 && description.trim().length >= 10 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No similar data products found. We'll help you build this from scratch.
            </p>
          )}
        </Card>
      )}

      {/* Domain & Owner Selection - Secondary card */}
      <Card className="border border-border/50 bg-muted/20">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wide">Context & Ownership</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="domain" className="text-sm font-medium">
                Business Domain *
              </Label>
            <Combobox
              options={domainOptions}
              value={domain}
              onValueChange={setDomain}
              placeholder="Select domain..."
              searchPlaceholder="Search domains..."
              emptyText="No domain found."
              allowCustom={true}
            />
            <p className="text-xs text-muted-foreground">
              Business area this product belongs to. Domains are managed in <span className="font-medium">Manage</span> section.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner" className="text-sm font-medium">
              Product Owner *
            </Label>
            <Combobox
              options={ownerOptions}
              value={owner}
              onValueChange={setOwner}
              placeholder="Select owner..."
              searchPlaceholder="Search teams..."
              emptyText="No owner found."
              allowCustom={true}
            />
            <p className="text-xs text-muted-foreground">
              Team or individual responsible for this data product.
            </p>
          </div>
        </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!isValid}
          size="lg"
          className="min-w-[200px]"
        >
          Continue to Data Discovery
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
