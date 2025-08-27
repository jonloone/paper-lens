"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Database, 
  Code, 
  BarChart3, 
  Package,
  Shield,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
}

const projectTypes = [
  { 
    id: 'dataset', 
    name: 'Dataset', 
    icon: Database, 
    description: 'Structured data product with schema and quality rules' 
  },
  { 
    id: 'model', 
    name: 'ML Model', 
    icon: Code, 
    description: 'Machine learning model with training pipeline' 
  },
  { 
    id: 'report', 
    name: 'Report', 
    icon: BarChart3, 
    description: 'Business intelligence report or dashboard' 
  },
  { 
    id: 'api', 
    name: 'API', 
    icon: Package, 
    description: 'Data service API endpoint' 
  }
];

const templates = [
  { id: 'blank', name: 'Blank Project', description: 'Start from scratch' },
  { id: 'customer360', name: 'Customer 360', description: 'Unified customer view template' },
  { id: 'sales-analytics', name: 'Sales Analytics', description: 'Sales performance tracking' },
  { id: 'inventory', name: 'Inventory Management', description: 'Stock and supply chain' },
  { id: 'financial', name: 'Financial Reporting', description: 'Revenue and cost analysis' }
];

export function NewProjectModal({ open, onClose }: NewProjectModalProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [projectType, setProjectType] = useState('dataset');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [team, setTeam] = useState('');
  const [odpsCompliant, setOdpsCompliant] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [aiSuggestions, setAiSuggestions] = useState(false);

  const handleCreate = () => {
    // Handle project creation
    console.log('Creating project:', {
      projectName,
      projectType,
      description,
      owner,
      team,
      odpsCompliant,
      selectedTemplate
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Data Product</DialogTitle>
          <DialogDescription>
            Set up a new ODPS-compliant data product with automated workflows
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="template">Template</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input 
                id="project-name"
                placeholder="e.g., Customer Analytics Dashboard"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                placeholder="Describe the purpose and scope of this data product..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Project Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {projectTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.id}
                      onClick={() => setProjectType(type.id)}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all",
                        projectType === type.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{type.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner">Owner</Label>
                <Input 
                  id="owner"
                  placeholder="Product owner email"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Input 
                  id="team"
                  placeholder="Team or department"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="data-source">Primary Data Source</Label>
              <Select>
                <SelectTrigger id="data-source">
                  <SelectValue placeholder="Select a data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data-lake">Primary Data Lake</SelectItem>
                  <SelectItem value="crm">CRM System</SelectItem>
                  <SelectItem value="erp">ERP Database</SelectItem>
                  <SelectItem value="warehouse">Data Warehouse</SelectItem>
                  <SelectItem value="api">External API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refresh">Refresh Schedule</Label>
              <Select>
                <SelectTrigger id="refresh">
                  <SelectValue placeholder="Select refresh frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="real-time">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment">Initial Environment</Label>
              <Select>
                <SelectTrigger id="environment">
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dev">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="prod">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <div>
                  <Label htmlFor="ai-suggestions">AI Configuration Assistant</Label>
                  <p className="text-xs text-muted-foreground">
                    Get intelligent suggestions for optimal configuration
                  </p>
                </div>
              </div>
              <Switch 
                id="ai-suggestions"
                checked={aiSuggestions}
                onCheckedChange={setAiSuggestions}
              />
            </div>

            {aiSuggestions && (
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-purple-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-purple-900 dark:text-purple-100">
                      AI Recommendations
                    </p>
                    <ul className="mt-1 space-y-1 text-purple-700 dark:text-purple-300">
                      <li>• Consider daily refresh for customer-facing data</li>
                      <li>• Enable incremental processing for large datasets</li>
                      <li>• Add quality checks for critical fields</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <Label htmlFor="odps">ODPS v4.0 Compliance</Label>
                  <p className="text-xs text-muted-foreground">
                    Follow Open Data Product Specification standards
                  </p>
                </div>
              </div>
              <Switch 
                id="odps"
                checked={odpsCompliant}
                onCheckedChange={setOdpsCompliant}
              />
            </div>

            {odpsCompliant && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Metadata Standards</span>
                  </div>
                  <Badge variant="outline">Auto-configured</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Quality Rules</span>
                  </div>
                  <Badge variant="outline">12 rules applied</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Data Lineage</span>
                  </div>
                  <Badge variant="outline">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Access Control</span>
                  </div>
                  <Badge variant="secondary">Configure after creation</Badge>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="template" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Choose a Template</Label>
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all",
                      selectedTemplate === template.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                      {selectedTemplate === template.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedTemplate !== 'blank' && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Template includes:
                    </p>
                    <ul className="mt-1 space-y-1 text-blue-700 dark:text-blue-300">
                      <li>• Pre-configured data sources and schemas</li>
                      <li>• Industry-standard quality rules</li>
                      <li>• Common transformations and aggregations</li>
                      <li>• Sample dashboards and reports</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!projectName || !owner}
          >
            Create Data Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}