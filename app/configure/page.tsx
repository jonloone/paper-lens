'use client';

import React, { useState } from 'react';
import { 
  Plus,
  Database,
  Cloud,
  FileText,
  Settings,
  Shield,
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Zap,
  GitBranch,
  Server,
  HardDrive,
  Package,
  Brain,
  BarChart3,
  Lock,
  Key,
  Globe,
  Layers,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Download,
  Upload,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  AlertTriangle,
  Info,
  TrendingUp,
  Activity,
  Cpu,
  Calendar,
  CreditCard,
  Star,
  Sparkles,
  Beaker,
  Microscope,
  LineChart,
  ShieldCheck,
  UserCheck,
  FileSearch,
  Gauge,
  Loader2,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Wrench,
  Rocket,
  Trophy,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// Types
interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'saas' | 'file' | 'api';
  category: string;
  status: 'active' | 'pending' | 'failed' | 'setup';
  icon: React.ReactNode;
  description?: string;
  metrics?: {
    throughput: string;
    lastSync: string;
    recordsProcessed?: number;
    uptime?: string;
  };
  issue?: {
    type: 'warning' | 'error';
    message: string;
  };
}

interface Capability {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'available' | 'enterprise' | 'trial';
  icon: React.ReactNode;
  description: string;
  pricing?: {
    base: string;
    perUser?: string;
    additional?: string;
  };
  resources?: {
    cpu: string;
    memory: string;
    storage: string;
  };
  benefits?: string[];
  setupTime?: string;
  users?: {
    current: number;
    max: number;
  };
  usage?: number;
}

export default function ConfigurePage() {
  const [activeTab, setActiveTab] = useState('sources');
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [selectedCapability, setSelectedCapability] = useState<Capability | null>(null);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [addSourceStep, setAddSourceStep] = useState<'select' | 'configure' | 'discovery' | 'sync' | 'deploy'>('select');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestStep, setRequestStep] = useState<'details' | 'justification' | 'configure' | 'review'>('details');

  // Mock data
  const dataSources: DataSource[] = [
    // Databases
    {
      id: 'postgres-customer',
      name: 'PostgreSQL - Customer DB',
      type: 'database',
      category: 'Databases',
      status: 'active',
      icon: <Database className="h-4 w-4" />,
      metrics: {
        throughput: '1,247 rec/hour',
        lastSync: '2 minutes ago',
        recordsProcessed: 2347892,
        uptime: '99.8%'
      }
    },
    {
      id: 'mysql-orders',
      name: 'MySQL - Orders',
      type: 'database',
      category: 'Databases',
      status: 'active',
      icon: <Database className="h-4 w-4" />,
      metrics: {
        throughput: '892 rec/hour',
        lastSync: '5 minutes ago',
        uptime: '99.9%'
      }
    },
    {
      id: 'snowflake-warehouse',
      name: 'Snowflake - Warehouse',
      type: 'database',
      category: 'Databases',
      status: 'active',
      icon: <Cloud className="h-4 w-4" />,
      metrics: {
        throughput: '45K rec/hour',
        lastSync: '1 hour ago',
        uptime: '100%'
      }
    },
    {
      id: 'oracle-erp',
      name: 'Oracle - Legacy ERP',
      type: 'database',
      category: 'Databases',
      status: 'pending',
      icon: <Database className="h-4 w-4" />,
      issue: {
        type: 'warning',
        message: 'Schema mapping in progress'
      }
    },
    {
      id: 'mongodb-sessions',
      name: 'MongoDB - Session Data',
      type: 'database',
      category: 'Databases',
      status: 'failed',
      icon: <Database className="h-4 w-4" />,
      issue: {
        type: 'error',
        message: 'Authentication failed'
      }
    },
    // SaaS Platforms
    {
      id: 'salesforce-crm',
      name: 'Salesforce CRM',
      type: 'saas',
      category: 'SaaS Platforms',
      status: 'active',
      icon: <Cloud className="h-4 w-4" />,
      metrics: {
        throughput: '234 rec/hour',
        lastSync: '15 minutes ago',
        uptime: '100%'
      }
    },
    {
      id: 'hubspot-marketing',
      name: 'HubSpot Marketing',
      type: 'saas',
      category: 'SaaS Platforms',
      status: 'active',
      icon: <Cloud className="h-4 w-4" />,
      metrics: {
        throughput: '567 rec/hour',
        lastSync: '8 minutes ago',
        uptime: '99.7%'
      }
    },
    {
      id: 'stripe-payments',
      name: 'Stripe Payments',
      type: 'saas',
      category: 'SaaS Platforms',
      status: 'active',
      icon: <CreditCard className="h-4 w-4" />,
      metrics: {
        throughput: '89 rec/hour',
        lastSync: '3 minutes ago',
        uptime: '100%'
      }
    },
    {
      id: 'zendesk-support',
      name: 'Zendesk Support',
      type: 'saas',
      category: 'SaaS Platforms',
      status: 'pending',
      icon: <Users className="h-4 w-4" />,
      issue: {
        type: 'warning',
        message: 'API rate limit approaching'
      }
    },
    // Files & Storage
    {
      id: 's3-datalake',
      name: 'S3 - Data Lake',
      type: 'file',
      category: 'Files & Storage',
      status: 'active',
      icon: <HardDrive className="h-4 w-4" />,
      metrics: {
        throughput: '12.3 GB/hour',
        lastSync: 'Continuous',
        uptime: '100%'
      }
    },
    {
      id: 'sftp-partners',
      name: 'SFTP - Partner Feeds',
      type: 'file',
      category: 'Files & Storage',
      status: 'active',
      icon: <FileText className="h-4 w-4" />,
      metrics: {
        throughput: '45 files/day',
        lastSync: '6 hours ago',
        uptime: '98.5%'
      }
    }
  ];

  const capabilities: Capability[] = [
    // ML & Analytics
    {
      id: 'mlflow',
      name: 'MLflow',
      category: 'ML & Analytics',
      status: 'active',
      icon: <Microscope className="h-4 w-4" />,
      description: 'Complete ML lifecycle management platform',
      pricing: {
        base: '$399/month',
        perUser: '$49/user'
      },
      resources: {
        cpu: '4 cores',
        memory: '8GB',
        storage: '100GB'
      },
      benefits: [
        'Experiment tracking and comparison',
        'Model registry and versioning',
        'Model deployment and serving',
        'Integration with Spark ML pipelines'
      ],
      setupTime: '15 minutes',
      users: { current: 7, max: 10 },
      usage: 87
    },
    {
      id: 'superset',
      name: 'Apache Superset',
      category: 'ML & Analytics',
      status: 'trial',
      icon: <BarChart3 className="h-4 w-4" />,
      description: 'Modern business intelligence platform',
      pricing: {
        base: '$299/month',
        perUser: '$29/user'
      },
      resources: {
        cpu: '2 cores',
        memory: '4GB',
        storage: '50GB'
      },
      benefits: [
        'Self-service analytics for business users',
        'Rich visualization library',
        'SQL Lab for data exploration',
        'Dashboard sharing and collaboration'
      ],
      users: { current: 3, max: 5 },
      usage: 23
    },
    {
      id: 'ray',
      name: 'Ray Distributed Computing',
      category: 'ML & Analytics',
      status: 'available',
      icon: <Zap className="h-4 w-4" />,
      description: 'Distributed computing for ML workloads',
      pricing: {
        base: '$599/month',
        additional: '$0.50/compute hour'
      },
      resources: {
        cpu: '8+ cores',
        memory: '32GB+',
        storage: 'Auto-scaling'
      }
    },
    {
      id: 'jupyter',
      name: 'Jupyter Notebooks',
      category: 'ML & Analytics',
      status: 'available',
      icon: <FileText className="h-4 w-4" />,
      description: 'Interactive computing notebooks',
      pricing: {
        base: '$199/month',
        perUser: '$19/user'
      }
    },
    // Security & Governance
    {
      id: 'advanced-rbac',
      name: 'Advanced RBAC',
      category: 'Security & Governance',
      status: 'enterprise',
      icon: <Shield className="h-4 w-4" />,
      description: 'Fine-grained access control system',
      benefits: [
        'Column-level data permissions',
        'Dynamic data masking',
        'Attribute-based access control',
        'Integration with enterprise SSO'
      ]
    },
    {
      id: 'pii-detection',
      name: 'PII Detection Suite',
      category: 'Security & Governance',
      status: 'available',
      icon: <FileSearch className="h-4 w-4" />,
      description: 'Automated PII discovery and protection',
      pricing: {
        base: '$799/month',
        additional: '$0.05/GB scanned'
      }
    },
    {
      id: 'compliance-dashboard',
      name: 'Compliance Dashboard',
      category: 'Security & Governance',
      status: 'available',
      icon: <ShieldCheck className="h-4 w-4" />,
      description: 'Regulatory compliance monitoring',
      pricing: {
        base: '$499/month'
      }
    },
    // Performance & Scale
    {
      id: 'high-performance',
      name: 'High-Performance Compute',
      category: 'Performance & Scale',
      status: 'active',
      icon: <Rocket className="h-4 w-4" />,
      description: 'Premium compute resources',
      pricing: {
        base: '$1,247/month',
        additional: 'Usage-based scaling'
      },
      usage: 145
    },
    {
      id: 'premium-storage',
      name: 'Premium Storage Tier',
      category: 'Performance & Scale',
      status: 'available',
      icon: <HardDrive className="h-4 w-4" />,
      description: 'High-speed SSD storage',
      pricing: {
        base: '$0.15/GB/month'
      }
    },
    {
      id: 'global-distribution',
      name: 'Global Distribution',
      category: 'Performance & Scale',
      status: 'available',
      icon: <Globe className="h-4 w-4" />,
      description: 'Multi-region data replication',
      pricing: {
        base: '$999/month'
      }
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending': 
      case 'setup': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'trial': return <Beaker className="h-4 w-4 text-blue-600" />;
      case 'available': return <Star className="h-4 w-4 text-gray-400" />;
      case 'enterprise': return <Lock className="h-4 w-4 text-purple-600" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      pending: 'secondary',
      failed: 'destructive',
      trial: 'outline',
      available: 'secondary',
      enterprise: 'outline'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  // Group data sources by category
  const sourcesByCategory = dataSources.reduce((acc, source) => {
    if (!acc[source.category]) acc[source.category] = [];
    acc[source.category].push(source);
    return acc;
  }, {} as Record<string, DataSource[]>);

  // Group capabilities by category
  const capabilitiesByCategory = capabilities.reduce((acc, cap) => {
    if (!acc[cap.category]) acc[cap.category] = [];
    acc[cap.category].push(cap);
    return acc;
  }, {} as Record<string, Capability[]>);

  const handleAddSource = () => {
    setShowAddSourceModal(true);
    setAddSourceStep('select');
  };

  const handleRequestCapability = (capability: Capability) => {
    setSelectedCapability(capability);
    setShowRequestModal(true);
    setRequestStep('details');
  };

  // Calculate statistics
  const sourceStats = {
    active: dataSources.filter(s => s.status === 'active').length,
    pending: dataSources.filter(s => s.status === 'pending' || s.status === 'setup').length,
    failed: dataSources.filter(s => s.status === 'failed').length,
    total: dataSources.length
  };

  const capabilityStats = {
    active: capabilities.filter(c => c.status === 'active' || c.status === 'trial').length,
    available: capabilities.filter(c => c.status === 'available').length,
    enterprise: capabilities.filter(c => c.status === 'enterprise').length
  };

  const currentMonthlySpend = 32847;
  const monthlyBudget = 50000;
  const projectedSpend = 41200;

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-light tracking-tight">Configure</h1>
          <p className="text-muted-foreground mt-2">NexusOne ecosystem control center</p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="sources" className="gap-2">
              <Database className="h-4 w-4" />
              Data Sources
            </TabsTrigger>
            <TabsTrigger value="capabilities" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Platform Capabilities
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings & Policies
            </TabsTrigger>
          </TabsList>

          {/* Data Sources Tab */}
          <TabsContent value="sources" className="space-y-6">
            {/* Overview Stats */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">{sourceStats.active}</span> Active
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="font-semibold">{sourceStats.pending}</span> Pending Setup
                    </span>
                    <span className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-semibold">{sourceStats.failed}</span> Failed
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Total throughput: <span className="font-medium">2.3M records/hour</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last sync: <span className="font-medium">5 minutes ago</span>
                    </div>
                    <Button onClick={handleAddSource} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Source
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Source Management */}
            <div className="grid grid-cols-[350px_1fr] gap-6">
              {/* Source Categories */}
              <div className="space-y-4">
                {Object.entries(sourcesByCategory).map(([category, sources]) => (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        {category === 'Databases' && <Database className="h-4 w-4" />}
                        {category === 'SaaS Platforms' && <Cloud className="h-4 w-4" />}
                        {category === 'Files & Storage' && <FileText className="h-4 w-4" />}
                        {category} ({sources.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {sources.map(source => (
                        <div
                          key={source.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",
                            "hover:bg-muted/50",
                            selectedSource?.id === source.id && "bg-muted"
                          )}
                          onClick={() => setSelectedSource(source)}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {getStatusIcon(source.status)}
                            <span className="text-sm font-medium truncate">{source.name}</span>
                          </div>
                          {source.issue && (
                            <AlertCircle className={cn(
                              "h-4 w-4",
                              source.issue.type === 'error' ? "text-red-600" : "text-yellow-600"
                            )} />
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
                
                <Button variant="outline" className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add Data Source
                </Button>
              </div>

              {/* Source Details */}
              <div>
                {selectedSource ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {selectedSource.icon}
                            {selectedSource.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {selectedSource.type === 'database' && 'Database Connection'}
                            {selectedSource.type === 'saas' && 'SaaS Integration'}
                            {selectedSource.type === 'file' && 'File Storage'}
                            {selectedSource.type === 'api' && 'API Connection'}
                          </CardDescription>
                        </div>
                        {getStatusBadge(selectedSource.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Connection Status */}
                      {selectedSource.status === 'active' && selectedSource.metrics && (
                        <div>
                          <h3 className="text-sm font-medium mb-3">Connection Status</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Throughput</p>
                              <p className="text-lg font-semibold">{selectedSource.metrics.throughput}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Last Sync</p>
                              <p className="text-lg font-semibold">{selectedSource.metrics.lastSync}</p>
                            </div>
                            {selectedSource.metrics.uptime && (
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Uptime (30 days)</p>
                                <p className="text-lg font-semibold">{selectedSource.metrics.uptime}</p>
                              </div>
                            )}
                            {selectedSource.metrics.recordsProcessed && (
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Records Processed</p>
                                <p className="text-lg font-semibold">{selectedSource.metrics.recordsProcessed.toLocaleString()}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Issue Alert */}
                      {selectedSource.issue && (
                        <Alert variant={selectedSource.issue.type === 'error' ? 'destructive' : 'default'}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>
                            {selectedSource.issue.type === 'error' ? 'Connection Issue' : 'Warning'}
                          </AlertTitle>
                          <AlertDescription>
                            {selectedSource.issue.message}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Sync Performance */}
                      {selectedSource.status === 'active' && (
                        <div>
                          <h3 className="text-sm font-medium mb-3">Sync Performance</h3>
                          <Card>
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Tables</span>
                                  <span className="text-sm font-medium">customers, orders, products</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Success Rate</span>
                                  <span className="text-sm font-medium">99.9%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Avg Latency</span>
                                  <span className="text-sm font-medium">3.2 minutes</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Data Quality</span>
                                  <span className="text-sm font-medium">96%</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Recent Activity */}
                      {selectedSource.status === 'active' && (
                        <div>
                          <h3 className="text-sm font-medium mb-3">Recent Activity</h3>
                          <div className="space-y-2">
                            <div className="flex items-start gap-3 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                              <div>
                                <p className="font-medium">customers table sync completed</p>
                                <p className="text-xs text-muted-foreground">15:23 - 2,347 new records</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                              <div>
                                <p className="font-medium">orders table sync completed</p>
                                <p className="text-xs text-muted-foreground">15:20 - 1,892 updates</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                              <div>
                                <p className="font-medium">Schema validation passed</p>
                                <p className="text-xs text-muted-foreground">15:15 - All tables validated</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {selectedSource.status === 'active' && (
                          <>
                            <Button variant="outline" size="sm">Test Connection</Button>
                            <Button variant="outline" size="sm">Modify Settings</Button>
                            <Button variant="outline" size="sm">View Data</Button>
                            <Button variant="outline" size="sm">Pause Sync</Button>
                          </>
                        )}
                        {selectedSource.status === 'failed' && (
                          <>
                            <Button variant="outline" size="sm">Update Credentials</Button>
                            <Button variant="outline" size="sm">Run Diagnostics</Button>
                            <Button variant="outline" size="sm">Contact Support</Button>
                          </>
                        )}
                        {selectedSource.status === 'pending' && (
                          <>
                            <Button variant="outline" size="sm">View Progress</Button>
                            <Button variant="outline" size="sm">Cancel Setup</Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <Database className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Select a data source to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Platform Capabilities Tab */}
          <TabsContent value="capabilities" className="space-y-6">
            {/* Current Entitlements */}
            <Card>
              <CardHeader>
                <CardTitle>Current Entitlements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    dbt Core (Included)
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Apache Spark (Standard Tier)
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Trino Query Engine
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Basic API Gateway
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Standard Monitoring
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3" />
                    2 Premium seats available
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Capability Management */}
            <div className="grid grid-cols-[350px_1fr] gap-6">
              {/* Capability Categories */}
              <div className="space-y-4">
                {Object.entries(capabilitiesByCategory).map(([category, caps]) => (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        {category === 'ML & Analytics' && <Microscope className="h-4 w-4" />}
                        {category === 'Security & Governance' && <Shield className="h-4 w-4" />}
                        {category === 'Performance & Scale' && <Zap className="h-4 w-4" />}
                        {category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {caps.map(cap => (
                        <div
                          key={cap.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",
                            "hover:bg-muted/50",
                            selectedCapability?.id === cap.id && "bg-muted"
                          )}
                          onClick={() => setSelectedCapability(cap)}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {cap.status === 'active' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                            {cap.status === 'trial' && <Beaker className="h-4 w-4 text-blue-600" />}
                            {cap.status === 'available' && <Star className="h-4 w-4 text-gray-400" />}
                            {cap.status === 'enterprise' && <Lock className="h-4 w-4 text-purple-600" />}
                            <span className="text-sm font-medium truncate">{cap.name}</span>
                          </div>
                          {cap.status === 'active' && cap.usage && (
                            <span className={cn(
                              "text-xs font-medium",
                              cap.usage > 100 ? "text-red-600" : 
                              cap.usage > 80 ? "text-yellow-600" : 
                              "text-green-600"
                            )}>
                              {cap.usage}%
                            </span>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
                
                <Button variant="outline" className="w-full gap-2">
                  <Search className="h-4 w-4" />
                  Browse All
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Request Custom
                </Button>
              </div>

              {/* Capability Details */}
              <div>
                {selectedCapability ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {selectedCapability.icon}
                            {selectedCapability.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {selectedCapability.description}
                          </CardDescription>
                        </div>
                        {getStatusBadge(selectedCapability.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Benefits */}
                      {selectedCapability.benefits && (
                        <div>
                          <h3 className="text-sm font-medium mb-3">What you'll get</h3>
                          <ul className="space-y-2">
                            {selectedCapability.benefits.map((benefit, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Pricing */}
                      {selectedCapability.pricing && (
                        <div>
                          <h3 className="text-sm font-medium mb-3">Pricing</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Base</span>
                              <span className="text-sm font-medium">{selectedCapability.pricing.base}</span>
                            </div>
                            {selectedCapability.pricing.perUser && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Per User</span>
                                <span className="text-sm font-medium">{selectedCapability.pricing.perUser}</span>
                              </div>
                            )}
                            {selectedCapability.pricing.additional && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Additional</span>
                                <span className="text-sm font-medium">{selectedCapability.pricing.additional}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Resources */}
                      {selectedCapability.resources && (
                        <div>
                          <h3 className="text-sm font-medium mb-3">Resources</h3>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <Cpu className="h-4 w-4 mx-auto mb-1" />
                              <p className="text-xs text-muted-foreground">CPU</p>
                              <p className="text-sm font-medium">{selectedCapability.resources.cpu}</p>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <Activity className="h-4 w-4 mx-auto mb-1" />
                              <p className="text-xs text-muted-foreground">Memory</p>
                              <p className="text-sm font-medium">{selectedCapability.resources.memory}</p>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <HardDrive className="h-4 w-4 mx-auto mb-1" />
                              <p className="text-xs text-muted-foreground">Storage</p>
                              <p className="text-sm font-medium">{selectedCapability.resources.storage}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Usage (for active capabilities) */}
                      {selectedCapability.status === 'active' && selectedCapability.users && (
                        <div>
                          <h3 className="text-sm font-medium mb-3">Usage</h3>
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm">Users</span>
                                <span className="text-sm font-medium">
                                  {selectedCapability.users.current}/{selectedCapability.users.max}
                                </span>
                              </div>
                              <Progress value={(selectedCapability.users.current / selectedCapability.users.max) * 100} />
                            </div>
                            {selectedCapability.usage && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm">Resource Usage</span>
                                  <span className="text-sm font-medium">{selectedCapability.usage}%</span>
                                </div>
                                <Progress value={selectedCapability.usage} />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {selectedCapability.status === 'available' && (
                          <>
                            <Button onClick={() => handleRequestCapability(selectedCapability)}>
                              Request {selectedCapability.name}
                            </Button>
                            <Button variant="outline">View Demo</Button>
                            <Button variant="outline">Talk to Sales</Button>
                          </>
                        )}
                        {selectedCapability.status === 'active' && (
                          <>
                            <Button variant="outline">Manage</Button>
                            <Button variant="outline">Scale Up</Button>
                            <Button variant="outline">Usage Report</Button>
                            <Button variant="outline">Renew</Button>
                          </>
                        )}
                        {selectedCapability.status === 'trial' && (
                          <>
                            <Button>Convert to Production</Button>
                            <Button variant="outline">Extend Trial</Button>
                            <Button variant="outline">Cancel</Button>
                          </>
                        )}
                        {selectedCapability.status === 'enterprise' && (
                          <>
                            <Button>Contact Sales</Button>
                            <Button variant="outline">Schedule Demo</Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Select a capability to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Settings & Policies Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Budget & Cost Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Budget & Cost Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Monthly Budget</span>
                    <span className="text-sm text-muted-foreground">
                      ${currentMonthlySpend.toLocaleString()} / ${monthlyBudget.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={(currentMonthlySpend / monthlyBudget) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Projected month-end: ${projectedSpend.toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">By Department</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Data Science</span>
                          <span className="font-medium">$18,500 (56%)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Engineering</span>
                          <span className="font-medium">$8,200 (25%)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Analytics</span>
                          <span className="font-medium">$6,147 (19%)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">By Capability</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Compute</span>
                          <span className="font-medium">$19,200 (58%)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Storage</span>
                          <span className="font-medium">$7,800 (24%)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Entitlements</span>
                          <span className="font-medium">$5,847 (18%)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Alert Thresholds</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>80% Alert</span>
                          <span className="font-medium">$40,000</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>95% Approval</span>
                          <span className="font-medium">$47,500</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>100% Hard Limit</span>
                          <span className="font-medium">$50,000</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Configure Alerts</Button>
                  <Button variant="outline" size="sm">Cost Analysis</Button>
                  <Button variant="outline" size="sm">Export Report</Button>
                </div>
              </CardContent>
            </Card>

            {/* Approval Workflows */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Approval Workflows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Tier 1</p>
                      <p className="text-sm font-medium">Under $1K/month</p>
                      <p className="text-xs text-green-600 mt-1">Auto-approve</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Tier 2</p>
                      <p className="text-sm font-medium">$1K-$5K/month</p>
                      <p className="text-xs text-yellow-600 mt-1">Manager approval (2 days)</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Tier 3</p>
                      <p className="text-sm font-medium">$5K-$25K/month</p>
                      <p className="text-xs text-orange-600 mt-1">Manager + Finance (5 days)</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Tier 4</p>
                      <p className="text-sm font-medium">Over $25K/month</p>
                      <p className="text-xs text-red-600 mt-1">CTO approval (10 days)</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Configure Workflows</Button>
                    <Button variant="outline" size="sm">View Pending Approvals</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Policies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Policies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Data Source Policies</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Encryption Required</span>
                        <Badge variant="default">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Approved Regions</span>
                        <span className="text-xs">US East, US West, EU West</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Prohibited Sources</span>
                        <span className="text-xs">Personal email, Public APIs</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-3">Access Policies</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>MFA Required</span>
                        <Badge variant="default">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Session Timeout</span>
                        <span className="text-xs">8 hours</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>IP Whitelist</span>
                        <Badge variant="secondary">Configured</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div>
                  <h4 className="text-sm font-medium mb-3">Compliance</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">GDPR Compliant</Badge>
                    <Badge variant="outline">SOC 2 Type II</Badge>
                    <Badge variant="outline">HIPAA Ready</Badge>
                    <Badge variant="outline">ISO 27001</Badge>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">Configure Policies</Button>
                  <Button variant="outline" size="sm">Security Audit</Button>
                  <Button variant="outline" size="sm">Compliance Report</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Data Source Modal */}
      <Dialog open={showAddSourceModal} onOpenChange={setShowAddSourceModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Step 1: Source Selection */}
          {addSourceStep === 'select' && (
            <>
              <DialogHeader>
                <DialogTitle>Add Data Source</DialogTitle>
                <DialogDescription>
                  What type of data source would you like to connect?
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 mt-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Popular Sources</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="p-4 text-center">
                        <Database className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">PostgreSQL</p>
                        <p className="text-xs text-muted-foreground">Database</p>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="p-4 text-center">
                        <Cloud className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Salesforce</p>
                        <p className="text-xs text-muted-foreground">CRM</p>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="p-4 text-center">
                        <Cloud className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Snowflake</p>
                        <p className="text-xs text-muted-foreground">Warehouse</p>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="p-4 text-center">
                        <CreditCard className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Stripe</p>
                        <p className="text-xs text-muted-foreground">Payments</p>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="p-4 text-center">
                        <Package className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Shopify</p>
                        <p className="text-xs text-muted-foreground">E-commerce</p>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="p-4 text-center">
                        <Users className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">HubSpot</p>
                        <p className="text-xs text-muted-foreground">Marketing</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Browse All Categories</h3>
                  <div className="space-y-2">
                    <Card className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Database className="h-5 w-5" />
                          <div>
                            <p className="text-sm font-medium">Databases & Warehouses</p>
                            <p className="text-xs text-muted-foreground">47 available connectors</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Cloud className="h-5 w-5" />
                          <div>
                            <p className="text-sm font-medium">SaaS & Business Applications</p>
                            <p className="text-xs text-muted-foreground">156 available connectors</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5" />
                          <div>
                            <p className="text-sm font-medium">Files, APIs & Custom Sources</p>
                            <p className="text-xs text-muted-foreground">23 available connectors</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setShowAddSourceModal(false)}>Cancel</Button>
                <Button onClick={() => setAddSourceStep('configure')}>Continue</Button>
                <Button variant="outline">Browse Catalog</Button>
                <Button variant="outline">Request Custom Integration</Button>
              </DialogFooter>
            </>
          )}
          
          {/* Additional steps would be implemented similarly */}
        </DialogContent>
      </Dialog>

      {/* Request Capability Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="max-w-3xl">
          {requestStep === 'details' && selectedCapability && (
            <>
              <DialogHeader>
                <DialogTitle>Request {selectedCapability.name}</DialogTitle>
                <DialogDescription>
                  Complete the request form to enable this capability
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Business Justification</Label>
                  <Textarea 
                    placeholder="Explain why your team needs this capability..."
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expected Users</Label>
                    <Input type="number" placeholder="5" />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Usage</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select usage level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Weekly)</SelectItem>
                        <SelectItem value="medium">Medium (Daily)</SelectItem>
                        <SelectItem value="high">High (Continuous)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Budget Owner</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget owner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sarah">Sarah Chen - Data Science Manager</SelectItem>
                      <SelectItem value="john">John Smith - Engineering Manager</SelectItem>
                      <SelectItem value="mike">Mike Johnson - Analytics Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 months</SelectItem>
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="12">12 months</SelectItem>
                        <SelectItem value="unlimited">Unlimited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {selectedCapability.pricing && (
                  <Alert>
                    <DollarSign className="h-4 w-4" />
                    <AlertTitle>Estimated Cost</AlertTitle>
                    <AlertDescription>
                      Base: {selectedCapability.pricing.base}
                      {selectedCapability.pricing.perUser && ` + ${selectedCapability.pricing.perUser} × 5 users`}
                      {' = '}
                      <span className="font-semibold">$644/month</span>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setShowRequestModal(false)}>Cancel</Button>
                <Button variant="outline">Save Draft</Button>
                <Button onClick={() => setRequestStep('justification')}>Continue</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}