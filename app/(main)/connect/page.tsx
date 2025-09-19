'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TechIcon } from '@/components/ui/tech-icon';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Search, Database, Globe, Server, Cloud, 
  Zap, CheckCircle, AlertCircle, Clock,
  Plus, Settings, Eye, ExternalLink,
  Layers, Package, Activity, Shield,
  ArrowRight, Filter, Grid, List,
  Download, Upload, RefreshCw, Play,
  Users, Lock, Key, Info, AlertTriangle,
  TrendingUp, TrendingDown, BarChart,
  ShieldCheck, FileSearch, Sparkles,
  CheckCheck, XCircle, Gauge, Target,
  GitBranch, Fingerprint, AlertOctagon,
  ChevronRight, ChevronDown, Loader2
} from 'lucide-react';
import { ConnectionAnalysisPanel } from '@/components/connect/ConnectionAnalysisPanel';

// Enhanced types for quality-first data source management
interface DataQualityProfile {
  completeness: number;
  accuracy: number;
  consistency: number;
  validity: number;
  uniqueness: number;
  timeliness: number;
  overallScore: number;
  issues: QualityIssue[];
  recommendations: string[];
}

interface QualityIssue {
  type: 'missing' | 'duplicate' | 'invalid' | 'outlier' | 'inconsistent';
  severity: 'critical' | 'high' | 'medium' | 'low';
  field: string;
  description: string;
  affectedRows: number;
  percentage: number;
}

interface DataProfile {
  rowCount: number;
  columnCount: number;
  nullPercentage: number;
  duplicatePercentage: number;
  patterns: {
    field: string;
    pattern: string;
    coverage: number;
  }[];
  statistics: {
    field: string;
    type: string;
    min?: number;
    max?: number;
    mean?: number;
    unique?: number;
    nulls?: number;
  }[];
  piiDetected: string[];
  sensitiveFields: string[];
}

interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'stream' | 'warehouse';
  technology: string;
  status: 'connected' | 'profiling' | 'failed' | 'discovering';
  lastSync: Date;
  recordCount: number;
  tables: number;
  description: string;
  tags: string[];
  owner: string;
  environment: 'production' | 'staging' | 'development';
  qualityProfile: DataQualityProfile;
  dataProfile: DataProfile;
  compliance: string[];
  connectionString?: string;
  credentials?: {
    type: 'basic' | 'oauth' | 'api-key' | 'certificate';
    status: 'valid' | 'expiring' | 'expired';
  };
}

interface DiscoveredSource {
  id: string;
  name: string;
  type: string;
  technology: string;
  location: string;
  estimatedSize: string;
  schema: any[];
  confidence: number;
  accessLevel: 'full' | 'limited' | 'readonly' | 'none';
  requirements: string[];
  qualityPreview?: {
    estimatedQuality: number;
    potentialIssues: string[];
    governanceFlags: string[];
  };
}

export default function ConnectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get('tab') || 'discovery';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isProfileing, setIsProfileing] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<string[]>([]);
  const [showQualityDetails, setShowQualityDetails] = useState<string | null>(null);

  // Enhanced mock data with quality profiles
  const [connectedSources, setConnectedSources] = useState<DataSource[]>([
    {
      id: 'src-001',
      name: 'Customer Analytics DB',
      type: 'database',
      technology: 'postgresql',
      status: 'connected',
      lastSync: new Date('2024-01-15T10:30:00'),
      recordCount: 2500000,
      tables: 45,
      description: 'Primary customer data and analytics warehouse',
      tags: ['customer', 'analytics', 'production'],
      owner: 'data-team',
      environment: 'production',
      qualityProfile: {
        completeness: 98.5,
        accuracy: 96.2,
        consistency: 97.8,
        validity: 94.1,
        uniqueness: 99.9,
        timeliness: 95.3,
        overallScore: 96.8,
        issues: [
          {
            type: 'missing',
            severity: 'medium',
            field: 'customer_segment',
            description: 'Missing values in customer segmentation',
            affectedRows: 12500,
            percentage: 0.5
          },
          {
            type: 'duplicate',
            severity: 'low',
            field: 'email_hash',
            description: 'Duplicate email hashes detected',
            affectedRows: 250,
            percentage: 0.01
          }
        ],
        recommendations: [
          'Implement NOT NULL constraints on critical fields',
          'Add unique index on email_hash field',
          'Update stale records older than 90 days'
        ]
      },
      dataProfile: {
        rowCount: 2500000,
        columnCount: 45,
        nullPercentage: 1.5,
        duplicatePercentage: 0.01,
        patterns: [
          { field: 'email', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', coverage: 99.8 },
          { field: 'phone', pattern: '^\\+?[1-9]\\d{1,14}$', coverage: 95.2 },
          { field: 'postal_code', pattern: '^[0-9]{5}(-[0-9]{4})?$', coverage: 98.7 }
        ],
        statistics: [
          { field: 'customer_id', type: 'integer', unique: 2500000, nulls: 0 },
          { field: 'age', type: 'integer', min: 18, max: 95, mean: 42.3, nulls: 1250 },
          { field: 'lifetime_value', type: 'decimal', min: 0, max: 125000, mean: 2850.50, nulls: 0 }
        ],
        piiDetected: ['email', 'phone', 'address', 'ssn_hash'],
        sensitiveFields: ['payment_method', 'credit_score', 'income_bracket']
      },
      compliance: ['GDPR', 'SOX', 'CCPA'],
      credentials: {
        type: 'certificate',
        status: 'valid'
      }
    },
    {
      id: 'src-002',
      name: 'Sales Force API',
      type: 'api',
      technology: 'salesforce',
      status: 'connected',
      lastSync: new Date('2024-01-15T11:45:00'),
      recordCount: 150000,
      tables: 12,
      description: 'CRM data from Salesforce instance',
      tags: ['crm', 'sales', 'api'],
      owner: 'sales-ops',
      environment: 'production',
      qualityProfile: {
        completeness: 92.3,
        accuracy: 89.5,
        consistency: 91.2,
        validity: 88.7,
        uniqueness: 98.5,
        timeliness: 85.4,
        overallScore: 90.9,
        issues: [
          {
            type: 'missing',
            severity: 'high',
            field: 'opportunity_stage',
            description: 'Missing opportunity stages affecting pipeline accuracy',
            affectedRows: 4500,
            percentage: 3.0
          },
          {
            type: 'inconsistent',
            severity: 'medium',
            field: 'account_industry',
            description: 'Inconsistent industry classifications',
            affectedRows: 2250,
            percentage: 1.5
          },
          {
            type: 'invalid',
            severity: 'high',
            field: 'close_date',
            description: 'Future dates in closed opportunities',
            affectedRows: 750,
            percentage: 0.5
          }
        ],
        recommendations: [
          'Enforce mandatory fields in Salesforce configuration',
          'Standardize industry picklist values',
          'Add validation rules for date fields',
          'Implement real-time sync to improve timeliness'
        ]
      },
      dataProfile: {
        rowCount: 150000,
        columnCount: 68,
        nullPercentage: 7.7,
        duplicatePercentage: 1.5,
        patterns: [
          { field: 'opportunity_id', pattern: '^006[0-9A-Za-z]{15}$', coverage: 100 },
          { field: 'account_id', pattern: '^001[0-9A-Za-z]{15}$', coverage: 100 }
        ],
        statistics: [
          { field: 'opportunity_amount', type: 'decimal', min: 0, max: 5000000, mean: 45000, nulls: 3000 },
          { field: 'probability', type: 'integer', min: 0, max: 100, mean: 35, nulls: 0 }
        ],
        piiDetected: ['contact_email', 'contact_phone'],
        sensitiveFields: ['revenue', 'contract_value']
      },
      compliance: ['SOC2', 'ISO27001'],
      credentials: {
        type: 'oauth',
        status: 'expiring'
      }
    },
    {
      id: 'src-003',
      name: 'Event Stream',
      type: 'stream',
      technology: 'kafka',
      status: 'connected',
      lastSync: new Date('2024-01-15T12:00:00'),
      recordCount: 5000000,
      tables: 8,
      description: 'Real-time user interaction events',
      tags: ['events', 'realtime', 'streaming'],
      owner: 'platform-team',
      environment: 'production',
      qualityProfile: {
        completeness: 87.2,
        accuracy: 92.1,
        consistency: 85.3,
        validity: 90.5,
        uniqueness: 95.2,
        timeliness: 99.8,
        overallScore: 91.7,
        issues: [
          {
            type: 'missing',
            severity: 'high',
            field: 'session_id',
            description: 'Missing session IDs in 13% of events',
            affectedRows: 650000,
            percentage: 13.0
          },
          {
            type: 'inconsistent',
            severity: 'medium',
            field: 'event_type',
            description: 'Non-standard event type naming',
            affectedRows: 425000,
            percentage: 8.5
          }
        ],
        recommendations: [
          'Implement client-side session ID generation',
          'Standardize event taxonomy across all producers',
          'Add schema registry for event validation'
        ]
      },
      dataProfile: {
        rowCount: 5000000,
        columnCount: 25,
        nullPercentage: 12.8,
        duplicatePercentage: 4.8,
        patterns: [
          { field: 'event_id', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', coverage: 100 },
          { field: 'timestamp', pattern: 'ISO8601', coverage: 100 }
        ],
        statistics: [
          { field: 'event_count', type: 'integer', min: 1, max: 1000, mean: 12.5, nulls: 0 }
        ],
        piiDetected: ['user_id', 'ip_address'],
        sensitiveFields: ['location', 'device_id']
      },
      compliance: ['GDPR'],
      credentials: {
        type: 'api-key',
        status: 'valid'
      }
    }
  ]);

  // Mock discovered sources with quality preview
  const [discoveredSources, setDiscoveredSources] = useState<DiscoveredSource[]>([
    {
      id: 'disc-001',
      name: 'HR Analytics Warehouse',
      type: 'warehouse',
      technology: 'snowflake',
      location: 'us-west-2.compute.amazonaws.com',
      estimatedSize: '2.3TB',
      schema: [
        { name: 'employees', records: 15000, columns: 45 },
        { name: 'performance', records: 45000, columns: 23 },
        { name: 'compensation', records: 30000, columns: 18 }
      ],
      confidence: 0.94,
      accessLevel: 'limited',
      requirements: ['VPN access', 'HR approval', 'RBAC setup'],
      qualityPreview: {
        estimatedQuality: 88,
        potentialIssues: [
          'Potential PII in 12 columns',
          'Missing data in historical records',
          'Inconsistent date formats detected'
        ],
        governanceFlags: [
          'Contains sensitive HR data',
          'Requires GDPR compliance',
          'Access logging mandatory'
        ]
      }
    },
    {
      id: 'disc-002',
      name: 'Marketing Automation',
      type: 'api',
      technology: 'marketo',
      location: 'api.marketo.com',
      estimatedSize: '450GB',
      schema: [
        { name: 'campaigns', records: 5000, columns: 32 },
        { name: 'leads', records: 250000, columns: 48 },
        { name: 'activities', records: 1200000, columns: 15 }
      ],
      confidence: 0.87,
      accessLevel: 'readonly',
      requirements: ['API key', 'Rate limiting', 'Data classification'],
      qualityPreview: {
        estimatedQuality: 75,
        potentialIssues: [
          'High null rate in custom fields',
          'Duplicate lead records likely',
          'Stale data older than 180 days'
        ],
        governanceFlags: [
          'Marketing consent tracking required',
          'CCPA compliance needed',
          'Email PII present'
        ]
      }
    }
  ]);

  const handleStartDiscovery = () => {
    setIsDiscovering(true);
    // Simulate discovery process
    setTimeout(() => {
      setIsDiscovering(false);
      // Add new discovered source
      const newSource: DiscoveredSource = {
        id: `disc-${Date.now()}`,
        name: 'Financial Data Lake',
        type: 'warehouse',
        technology: 'databricks',
        location: 'azure.databricks.com',
        estimatedSize: '5.7TB',
        schema: [
          { name: 'transactions', records: 50000000, columns: 85 },
          { name: 'accounts', records: 2000000, columns: 62 }
        ],
        confidence: 0.91,
        accessLevel: 'full',
        requirements: ['Azure AD integration', 'Network whitelisting'],
        qualityPreview: {
          estimatedQuality: 92,
          potentialIssues: [
            'Currency conversion inconsistencies',
            'Missing merchant categories'
          ],
          governanceFlags: [
            'PCI DSS compliance required',
            'Financial data encryption mandatory'
          ]
        }
      };
      setDiscoveredSources(prev => [newSource, ...prev]);
    }, 3000);
  };

  const handleProfileSource = (sourceId: string) => {
    setIsProfileing(sourceId);
    // Simulate profiling process
    setTimeout(() => {
      setIsProfileing(null);
      // Update source with enhanced profile
      setConnectedSources(prev => prev.map(source => {
        if (source.id === sourceId) {
          return {
            ...source,
            status: 'connected',
            qualityProfile: {
              ...source.qualityProfile,
              overallScore: Math.min(100, source.qualityProfile.overallScore + Math.random() * 5)
            }
          };
        }
        return source;
      }));
    }, 2000);
  };

  const handleConnect = (sourceId: string) => {
    router.push(`/connect/setup?source=${sourceId}`);
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getQualityBadge = (score: number) => {
    if (score >= 90) return { label: 'Excellent', variant: 'default' as const };
    if (score >= 75) return { label: 'Good', variant: 'secondary' as const };
    if (score >= 60) return { label: 'Fair', variant: 'outline' as const };
    return { label: 'Poor', variant: 'destructive' as const };
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertOctagon className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'low': return <Info className="h-4 w-4 text-blue-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'profiling':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'discovering':
        return <Search className="h-4 w-4 text-yellow-600 animate-pulse" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredSources = connectedSources.filter(source => {
    const matchesSearch = source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         source.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         source.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterType === 'all' || source.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // Calculate overall platform quality
  const overallQuality = connectedSources.length > 0
    ? Math.round(connectedSources.reduce((sum, s) => sum + s.qualityProfile.overallScore, 0) / connectedSources.length)
    : 0;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Connect</h2>
          <p className="text-muted-foreground">
            Discover, profile, and connect to data sources with quality-first governance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Platform Quality</span>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <span className={cn("text-2xl font-bold", getQualityColor(overallQuality))}>
                {overallQuality}%
              </span>
              <Badge variant={getQualityBadge(overallQuality).variant}>
                {getQualityBadge(overallQuality).label}
              </Badge>
            </div>
          </div>
          <Button onClick={handleStartDiscovery} disabled={isDiscovering}>
            {isDiscovering ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Discovering...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Discover Sources
              </>
            )}
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => router.push(`/connect?tab=${value}`)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="discovery">Quality Discovery</TabsTrigger>
          <TabsTrigger value="connected">Connected Sources</TabsTrigger>
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="profiling">Data Profiling</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
        </TabsList>

        <TabsContent value="discovery" className="space-y-6">
          {/* Quality-First Discovery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI-Powered Quality Discovery
              </CardTitle>
              <CardDescription>
                Automatically discover and assess data sources with quality scoring and governance evaluation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <Cloud className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium">Cloud Resources</p>
                    <p className="text-sm text-muted-foreground">AWS, GCP, Azure</p>
                    <div className="mt-3 space-y-2">
                      <Badge variant="outline" className="text-xs">Auto-profile</Badge>
                      <Button size="sm" className="w-full">
                        <Search className="h-3 w-3 mr-1" />
                        Scan & Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <Server className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium">On-Premise</p>
                    <p className="text-sm text-muted-foreground">Local databases</p>
                    <div className="mt-3 space-y-2">
                      <Badge variant="outline" className="text-xs">Quality scan</Badge>
                      <Button size="sm" className="w-full">
                        <Search className="h-3 w-3 mr-1" />
                        Scan & Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <Globe className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium">SaaS APIs</p>
                    <p className="text-sm text-muted-foreground">Third-party services</p>
                    <div className="mt-3 space-y-2">
                      <Badge variant="outline" className="text-xs">Compliance check</Badge>
                      <Button size="sm" className="w-full">
                        <Search className="h-3 w-3 mr-1" />
                        Scan & Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {discoveredSources.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Discovered Sources
                    <Badge>{discoveredSources.length}</Badge>
                  </h3>
                  <div className="space-y-3">
                    {discoveredSources.map((source) => (
                      <Card key={source.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <TechIcon technology={source.technology} size="md" />
                              <div className="space-y-2">
                                <div>
                                  <h4 className="font-medium">{source.name}</h4>
                                  <p className="text-sm text-muted-foreground">{source.location}</p>
                                </div>
                                <div className="flex items-center gap-4 text-xs">
                                  <Badge variant="outline">{source.type}</Badge>
                                  <span className="text-muted-foreground">{source.estimatedSize}</span>
                                  <span className="font-medium text-green-600">
                                    {Math.round(source.confidence * 100)}% confidence
                                  </span>
                                </div>
                                
                                {/* Quality Preview */}
                                {source.qualityPreview && (
                                  <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">Estimated Quality</span>
                                      <div className="flex items-center gap-2">
                                        <Progress value={source.qualityPreview.estimatedQuality} className="w-24" />
                                        <span className={cn("text-sm font-bold", getQualityColor(source.qualityPreview.estimatedQuality))}>
                                          {source.qualityPreview.estimatedQuality}%
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {source.qualityPreview.potentialIssues.length > 0 && (
                                      <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Potential Issues:</p>
                                        {source.qualityPreview.potentialIssues.map((issue, idx) => (
                                          <div key={idx} className="flex items-center gap-2 text-xs">
                                            <AlertCircle className="h-3 w-3 text-yellow-600" />
                                            <span>{issue}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {source.qualityPreview.governanceFlags.length > 0 && (
                                      <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Governance:</p>
                                        {source.qualityPreview.governanceFlags.map((flag, idx) => (
                                          <div key={idx} className="flex items-center gap-2 text-xs">
                                            <ShieldCheck className="h-3 w-3 text-blue-600" />
                                            <span>{flag}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Schema Preview */}
                                <div className="flex items-center gap-2 text-xs">
                                  <Database className="h-3 w-3" />
                                  <span>{source.schema.length} tables</span>
                                  <span>•</span>
                                  <span>{source.schema.reduce((sum, s) => sum + s.records, 0).toLocaleString()} records</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Badge variant={source.accessLevel === 'full' ? 'default' : 'secondary'}>
                                {source.accessLevel} access
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3 mr-1" />
                                Preview
                              </Button>
                              <Button size="sm" onClick={() => handleConnect(source.id)}>
                                <Zap className="h-3 w-3 mr-1" />
                                Connect
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connected" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="file">File</SelectItem>
                <SelectItem value="stream">Stream</SelectItem>
                <SelectItem value="warehouse">Warehouse</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>

          <div className="grid gap-6">
            {filteredSources.map((source) => (
              <Card key={source.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <TechIcon technology={source.technology} size="lg" />
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{source.name}</h3>
                            {getStatusIcon(source.status)}
                            <Badge variant={source.environment === 'production' ? 'default' : 'secondary'}>
                              {source.environment}
                            </Badge>
                            {source.credentials && (
                              <Badge 
                                variant={source.credentials.status === 'valid' ? 'outline' : 'destructive'}
                                className="text-xs"
                              >
                                {source.credentials.type} • {source.credentials.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground">{source.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span>{source.recordCount.toLocaleString()} records</span>
                            <span>{source.tables} tables</span>
                            <span>Owner: {source.owner}</span>
                            <span>Last sync: {source.lastSync.toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {source.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Quality Score</span>
                            <span className={cn("text-2xl font-bold", getQualityColor(source.qualityProfile.overallScore))}>
                              {source.qualityProfile.overallScore.toFixed(1)}%
                            </span>
                          </div>
                          <Badge variant={getQualityBadge(source.qualityProfile.overallScore).variant}>
                            {getQualityBadge(source.qualityProfile.overallScore).label} Quality
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleProfileSource(source.id)}
                            disabled={isProfileing === source.id}
                          >
                            {isProfileing === source.id ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Profiling...
                              </>
                            ) : (
                              <>
                                <BarChart className="h-3 w-3 mr-1" />
                                Re-profile
                              </>
                            )}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-3 w-3 mr-1" />
                            Configure
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowQualityDetails(showQualityDetails === source.id ? null : source.id)}
                          >
                            {showQualityDetails === source.id ? (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <ChevronRight className="h-3 w-3 mr-1" />
                                Show Details
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Quality Details */}
                    {showQualityDetails === source.id && (
                      <>
                        <Separator />
                        <div className="grid grid-cols-2 gap-6">
                          {/* Quality Dimensions */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Quality Dimensions</h4>
                            <div className="space-y-2">
                              {Object.entries({
                                Completeness: source.qualityProfile.completeness,
                                Accuracy: source.qualityProfile.accuracy,
                                Consistency: source.qualityProfile.consistency,
                                Validity: source.qualityProfile.validity,
                                Uniqueness: source.qualityProfile.uniqueness,
                                Timeliness: source.qualityProfile.timeliness
                              }).map(([dimension, score]) => (
                                <div key={dimension} className="flex items-center justify-between">
                                  <span className="text-sm">{dimension}</span>
                                  <div className="flex items-center gap-2">
                                    <Progress value={score} className="w-24" />
                                    <span className={cn("text-sm font-medium w-12 text-right", getQualityColor(score))}>
                                      {score}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Data Profile Stats */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Data Profile</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Null Rate:</span>
                                <span className="ml-2 font-medium">{source.dataProfile.nullPercentage}%</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Duplicates:</span>
                                <span className="ml-2 font-medium">{source.dataProfile.duplicatePercentage}%</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Columns:</span>
                                <span className="ml-2 font-medium">{source.dataProfile.columnCount}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Rows:</span>
                                <span className="ml-2 font-medium">{source.dataProfile.rowCount.toLocaleString()}</span>
                              </div>
                            </div>
                            
                            {/* PII Detection */}
                            {source.dataProfile.piiDetected.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">PII Detected:</p>
                                <div className="flex flex-wrap gap-1">
                                  {source.dataProfile.piiDetected.map(field => (
                                    <Badge key={field} variant="destructive" className="text-xs">
                                      <Fingerprint className="h-3 w-3 mr-1" />
                                      {field}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quality Issues */}
                        {source.qualityProfile.issues.length > 0 && (
                          <>
                            <Separator />
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium">Quality Issues</h4>
                              <div className="space-y-2">
                                {source.qualityProfile.issues.map((issue, idx) => (
                                  <div key={idx} className="flex items-start gap-3 p-2 bg-muted/50 rounded-lg">
                                    {getSeverityIcon(issue.severity)}
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{issue.description}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Field: {issue.field} • {issue.affectedRows.toLocaleString()} rows ({issue.percentage}%)
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {/* Recommendations */}
                        {source.qualityProfile.recommendations.length > 0 && (
                          <>
                            <Separator />
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium">Recommendations</h4>
                              <div className="space-y-2">
                                {source.qualityProfile.recommendations.map((rec, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-sm">
                                    <CheckCheck className="h-4 w-4 text-green-600 mt-0.5" />
                                    <span>{rec}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {/* Compliance */}
                        <Separator />
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">Compliance:</span>
                          <div className="flex gap-2">
                            {source.compliance.map(comp => (
                              <Badge key={comp} variant="secondary" className="text-xs">
                                {comp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai-analysis" className="space-y-6">
          <ConnectionAnalysisPanel 
            sources={connectedSources.map(source => ({
              name: source.name,
              connection_type: source.type,
              connection_details: {
                technology: source.technology,
                environment: source.environment,
                tables: source.tables,
                records: source.recordCount
              },
              target_system: 'data_warehouse'
            }))}
            onAnalysisComplete={(result) => {
              console.log('Analysis complete:', result);
            }}
          />
        </TabsContent>

        <TabsContent value="profiling" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="h-5 w-5" />
                Automated Data Profiling
              </CardTitle>
              <CardDescription>
                Deep quality analysis with pattern detection, statistical profiling, and anomaly identification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>AI-Powered Profiling</AlertTitle>
                <AlertDescription>
                  Our profiling engine automatically detects data quality issues, identifies patterns, 
                  and provides actionable recommendations for improvement.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Pattern Detection</span>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Identifies formats, regex patterns, and data structures
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Statistical Analysis</span>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Calculates distributions, outliers, and correlations
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Governance Check</span>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Detects PII, sensitive data, and compliance requirements
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="governance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Data Governance & Compliance
              </CardTitle>
              <CardDescription>
                Automated governance assessment and compliance tracking across all data sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold">87%</span>
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-sm font-medium">Compliance Score</p>
                    <p className="text-xs text-muted-foreground">Across all sources</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold">23</span>
                      <Fingerprint className="h-5 w-5 text-orange-600" />
                    </div>
                    <p className="text-sm font-medium">PII Fields</p>
                    <p className="text-xs text-muted-foreground">Detected & protected</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold">5</span>
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <p className="text-sm font-medium">Risk Items</p>
                    <p className="text-xs text-muted-foreground">Require attention</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold">100%</span>
                      <Lock className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium">Encrypted</p>
                    <p className="text-xs text-muted-foreground">At rest & in transit</p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-3">Compliance Frameworks</h4>
                <div className="grid grid-cols-2 gap-4">
                  {['GDPR', 'CCPA', 'SOX', 'HIPAA', 'PCI DSS', 'ISO 27001'].map(framework => (
                    <div key={framework} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{framework}</span>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}