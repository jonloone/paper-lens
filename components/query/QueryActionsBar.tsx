'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Save,
  Share2,
  GitBranch,
  Shield,
  Zap,
  Calendar,
  RefreshCw,
  Database,
  FileJson,
  Code2,
  Settings,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
  Lock,
  Eye,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueryActionsBarProps {
  queryResult?: {
    data: any[];
    schema: any;
    sql?: string;
    naturalLanguage?: string;
  };
  onProductize?: (config: ProductConfig) => void;
  onSaveQuery?: (name: string, description: string) => void;
  onSchedule?: (schedule: ScheduleConfig) => void;
  onShare?: (shareConfig: ShareConfig) => void;
  onCreatePipeline?: () => void;
}

interface ProductConfig {
  name: string;
  description: string;
  category: string;
  owner: string;
  tags: string[];
  visibility: 'private' | 'team' | 'organization';
  refreshSchedule: string;
  qualityChecks: boolean;
  odpsCompliance: boolean;
}

interface ScheduleConfig {
  frequency: string;
  startTime: string;
  endTime?: string;
  notifications: boolean;
}

interface ShareConfig {
  recipients: string[];
  permissions: 'view' | 'edit' | 'admin';
  message?: string;
}

export function QueryActionsBar({
  queryResult,
  onProductize,
  onSaveQuery,
  onSchedule,
  onShare,
  onCreatePipeline,
}: QueryActionsBarProps) {
  const [isProductizing, setIsProductizing] = useState(false);
  const [productConfig, setProductConfig] = useState<Partial<ProductConfig>>({
    visibility: 'team',
    qualityChecks: true,
    odpsCompliance: true,
  });
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleProductize = async () => {
    if (!productConfig.name || !productConfig.description) return;
    
    setIsProductizing(true);
    try {
      await onProductize?.(productConfig as ProductConfig);
      setShowProductDialog(false);
    } finally {
      setIsProductizing(false);
    }
  };

  const quickActions = [
    {
      id: 'productize',
      label: 'Create Data Product',
      icon: Package,
      color: 'text-blue-500',
      description: 'Convert to reusable data product',
      onClick: () => setShowProductDialog(true),
    },
    {
      id: 'save',
      label: 'Save Query',
      icon: Save,
      color: 'text-green-500',
      description: 'Save for later use',
      onClick: () => setShowSaveDialog(true),
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: Calendar,
      color: 'text-purple-500',
      description: 'Run on schedule',
      onClick: () => setShowScheduleDialog(true),
    },
    {
      id: 'share',
      label: 'Share',
      icon: Share2,
      color: 'text-orange-500',
      description: 'Share with team',
      onClick: () => setShowShareDialog(true),
    },
    {
      id: 'pipeline',
      label: 'Create Pipeline',
      icon: GitBranch,
      color: 'text-cyan-500',
      description: 'Build data pipeline',
      onClick: () => onCreatePipeline?.(),
    },
  ];

  if (!queryResult) return null;

  return (
    <>
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium">Quick Actions</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Transform your query into production-ready assets
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
          
          <div className="grid grid-cols-5 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className="group relative flex flex-col items-center justify-center p-4 rounded-lg border border-border bg-card hover:bg-accent transition-all duration-200 hover:scale-105"
                >
                  <Icon className={cn("h-6 w-6 mb-2", action.color)} />
                  <span className="text-sm font-medium">{action.label}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </span>
                </button>
              );
            })}
          </div>
          
          {/* One-Click Productization Banner */}
          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/20">
                  <Zap className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Quick Productization Available</p>
                  <p className="text-xs text-muted-foreground">
                    Transform this query into a data product with one click
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                onClick={() => setShowProductDialog(true)}
              >
                <Package className="h-4 w-4 mr-2" />
                Productize Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Productization Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Data Product</DialogTitle>
            <DialogDescription>
              Convert your query into a reusable, governed data product with ODPS v4.0 compliance
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                placeholder="Customer Churn Analysis"
                value={productConfig.name || ''}
                onChange={(e) => setProductConfig({ ...productConfig, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                placeholder="Analyzes customer behavior to predict churn risk..."
                value={productConfig.description || ''}
                onChange={(e) => setProductConfig({ ...productConfig, description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-category">Category</Label>
                <Select
                  value={productConfig.category}
                  onValueChange={(value) => setProductConfig({ ...productConfig, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="reporting">Reporting</SelectItem>
                    <SelectItem value="ml-features">ML Features</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="product-visibility">Visibility</Label>
                <Select
                  value={productConfig.visibility}
                  onValueChange={(value: any) => setProductConfig({ ...productConfig, visibility: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="h-3 w-3" />
                        Private
                      </div>
                    </SelectItem>
                    <SelectItem value="team">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        Team
                      </div>
                    </SelectItem>
                    <SelectItem value="organization">
                      <div className="flex items-center gap-2">
                        <Eye className="h-3 w-3" />
                        Organization
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-owner">Owner</Label>
              <Input
                id="product-owner"
                placeholder="data-engineering-team"
                value={productConfig.owner || ''}
                onChange={(e) => setProductConfig({ ...productConfig, owner: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-schedule">Refresh Schedule</Label>
              <Select
                value={productConfig.refreshSchedule}
                onValueChange={(value) => setProductConfig({ ...productConfig, refreshSchedule: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="@hourly">Hourly</SelectItem>
                  <SelectItem value="@daily">Daily</SelectItem>
                  <SelectItem value="@weekly">Weekly</SelectItem>
                  <SelectItem value="@monthly">Monthly</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Compliance Options */}
            <div className="space-y-3 p-4 rounded-lg bg-muted">
              <Label>Governance & Compliance</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={productConfig.qualityChecks}
                    onChange={(e) => setProductConfig({ ...productConfig, qualityChecks: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Enable automated quality checks</span>
                  </div>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={productConfig.odpsCompliance}
                    onChange={(e) => setProductConfig({ ...productConfig, odpsCompliance: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">ODPS v4.0 Compliance</span>
                  </div>
                </label>
              </div>
            </div>
            
            {/* Preview */}
            {productConfig.name && (
              <div className="p-4 rounded-lg border border-border bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Product Preview</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>Name: {productConfig.name}</div>
                  <div>Type: SQLMesh Model</div>
                  <div>Schedule: {productConfig.refreshSchedule || 'Not set'}</div>
                  <div>DataHub Integration: Enabled</div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProductize}
              disabled={!productConfig.name || !productConfig.description || isProductizing}
            >
              {isProductizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Create Product
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Query Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Query</DialogTitle>
            <DialogDescription>
              Save this query for future reference and reuse
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="query-name">Query Name</Label>
              <Input id="query-name" placeholder="Monthly Revenue Analysis" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="query-description">Description</Label>
              <Textarea
                id="query-description"
                placeholder="Calculates monthly revenue by segment..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowSaveDialog(false)}>
              <Save className="h-4 w-4 mr-2" />
              Save Query
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Query</DialogTitle>
            <DialogDescription>
              Run this query automatically on a schedule
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-frequency">Frequency</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Every Hour</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-time">Start Time</Label>
              <Input id="schedule-time" type="time" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowScheduleDialog(false)}>
              <Calendar className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}