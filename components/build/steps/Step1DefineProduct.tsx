'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowRight } from 'lucide-react';

export interface ProductDefinition {
  name: string;              // Lowercase, underscores only
  displayName: string;
  description: string;
  domain: string;
  owner: string;
  tags: string[];
  schedule: {
    type: 'hourly' | 'daily' | 'weekly' | 'cron';
    time?: string;           // For daily: "02:00"
    day?: string;            // For weekly: "monday"
    cron?: string;           // For custom
  };
  sla: {
    freshnessHours: number;
    qualityThreshold: number;
    availabilityTarget: number;
  };
}

export interface Step1Data {
  definition: ProductDefinition;
}

interface Step1DefineProductProps {
  initialData?: Partial<Step1Data>;
  onComplete: (data: Step1Data) => void;
}

export function Step1DefineProduct({ initialData, onComplete }: Step1DefineProductProps) {
  const [definition, setDefinition] = useState<ProductDefinition>(
    initialData?.definition || {
      name: '',
      displayName: '',
      description: '',
      domain: '',
      owner: '',
      tags: [],
      schedule: {
        type: 'daily',
        time: '02:00'
      },
      sla: {
        freshnessHours: 2,
        qualityThreshold: 90,
        availabilityTarget: 99.5
      }
    }
  );

  const [nameError, setNameError] = useState<string>('');
  const [tagInput, setTagInput] = useState('');

  // Real-time validation for product name
  function validateProductName(name: string): boolean {
    // Check format: lowercase and underscores only
    if (!/^[a-z_]+$/.test(name)) {
      setNameError('Use lowercase and underscores only');
      return false;
    }

    // TODO: Check uniqueness against DataHub
    // const exists = await api.checkProductExists(name);
    // if (exists) {
    //   setNameError(`Product '${name}' already exists`);
    //   return false;
    // }

    setNameError('');
    return true;
  }

  function handleNameChange(value: string) {
    setDefinition({ ...definition, name: value });
    if (value) {
      validateProductName(value);
    } else {
      setNameError('');
    }
  }

  function addTag() {
    if (tagInput && !definition.tags.includes(tagInput)) {
      setDefinition({
        ...definition,
        tags: [...definition.tags, tagInput]
      });
      setTagInput('');
    }
  }

  function removeTag(tag: string) {
    setDefinition({
      ...definition,
      tags: definition.tags.filter(t => t !== tag)
    });
  }

  const isValid =
    definition.name.trim() !== '' &&
    !nameError &&
    definition.displayName.trim() !== '' &&
    definition.description.trim() !== '' &&
    definition.domain.trim() !== '' &&
    definition.owner.trim() !== '';

  function handleContinue() {
    if (isValid) {
      onComplete({ definition });
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Define Data Product</h2>
        <p className="text-muted-foreground text-lg">
          Let's create the contract for your data product.
        </p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={definition.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="customer_churn_risk"
              className={nameError ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">
              Lowercase, underscores only
            </p>
            {nameError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{nameError}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              value={definition.displayName}
              onChange={(e) => setDefinition({ ...definition, displayName: e.target.value })}
              placeholder="Customer Churn Risk"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={definition.description}
              onChange={(e) => setDefinition({ ...definition, description: e.target.value })}
              placeholder="Daily customer churn risk scores based on engagement, support tickets, and usage patterns. Used by Customer Success team for proactive retention."
              rows={4}
            />
          </div>

          {/* Domain */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain *</Label>
              <Select
                value={definition.domain}
                onValueChange={(value) => setDefinition({ ...definition, domain: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer_success">Customer Success</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Owner */}
            <div className="space-y-2">
              <Label htmlFor="owner">Owner *</Label>
              <Input
                id="owner"
                value={definition.owner}
                onChange={(e) => setDefinition({ ...definition, owner: e.target.value })}
                placeholder="jamie@company.com"
                type="email"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="churn, ml, customer"
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {definition.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {definition.tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Refresh Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Refresh Schedule</CardTitle>
          <CardDescription>How often should this data refresh?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={definition.schedule.type}
            onValueChange={(value: any) => setDefinition({
              ...definition,
              schedule: { ...definition.schedule, type: value }
            })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hourly" id="hourly" />
              <Label htmlFor="hourly">Hourly</Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="daily" id="daily" />
              <Label htmlFor="daily">Daily at</Label>
              {definition.schedule.type === 'daily' && (
                <Input
                  type="time"
                  value={definition.schedule.time || '02:00'}
                  onChange={(e) => setDefinition({
                    ...definition,
                    schedule: { ...definition.schedule, time: e.target.value }
                  })}
                  className="w-32"
                />
              )}
              <span className="text-sm text-muted-foreground">UTC</span>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="weekly" id="weekly" />
              <Label htmlFor="weekly">Weekly on</Label>
              {definition.schedule.type === 'weekly' && (
                <Select
                  value={definition.schedule.day || 'monday'}
                  onValueChange={(value) => setDefinition({
                    ...definition,
                    schedule: { ...definition.schedule, day: value }
                  })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cron" id="cron" />
              <Label htmlFor="cron">Custom cron:</Label>
              {definition.schedule.type === 'cron' && (
                <Input
                  value={definition.schedule.cron || ''}
                  onChange={(e) => setDefinition({
                    ...definition,
                    schedule: { ...definition.schedule, cron: e.target.value }
                  })}
                  placeholder="0 2 * * *"
                  className="w-48 font-mono"
                />
              )}
            </div>
          </RadioGroup>

          <Alert>
            <AlertDescription className="text-sm">
              ⚠️ Note: More frequent = higher cost
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* SLA Expectations */}
      <Card>
        <CardHeader>
          <CardTitle>SLA Expectations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Freshness */}
          <div className="space-y-2">
            <Label htmlFor="freshness">Freshness: Data must be updated within</Label>
            <div className="flex items-center gap-2">
              <Input
                id="freshness"
                type="number"
                min="1"
                value={definition.sla.freshnessHours}
                onChange={(e) => setDefinition({
                  ...definition,
                  sla: { ...definition.sla, freshnessHours: Number(e.target.value) }
                })}
                className="w-24"
              />
              <span className="text-sm">hours of source</span>
            </div>
          </div>

          {/* Quality */}
          <div className="space-y-2">
            <Label htmlFor="quality">Quality: Minimum acceptable quality score</Label>
            <div className="flex items-center gap-2">
              <Input
                id="quality"
                type="number"
                min="0"
                max="100"
                value={definition.sla.qualityThreshold}
                onChange={(e) => setDefinition({
                  ...definition,
                  sla: { ...definition.sla, qualityThreshold: Number(e.target.value) }
                })}
                className="w-24"
              />
              <span className="text-sm">%</span>
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <Label htmlFor="availability">Availability: Target uptime</Label>
            <div className="flex items-center gap-2">
              <Input
                id="availability"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={definition.sla.availabilityTarget}
                onChange={(e) => setDefinition({
                  ...definition,
                  sla: { ...definition.sla, availabilityTarget: Number(e.target.value) }
                })}
                className="w-24"
              />
              <span className="text-sm">%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleContinue}
          disabled={!isValid}
          size="lg"
          className="min-w-[200px]"
        >
          Continue to Sources
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
