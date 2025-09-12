'use client';

import React, { useState, useEffect } from 'react';
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
  Target,
  BookOpen,
  Play,
  Eye,
  MemoryStick,
  HardDriveIcon,
  Workflow,
  GitGraph,
  Hash,
  Code,
  Binary,
  Boxes,
  Container,
  Webhook,
  MessageSquare,
  Award,
  Medal,
  GraduationCap,
  Building2,
  Briefcase,
  Calculator,
  ChevronsUpDown,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Circle,
  CircleCheckBig,
  CircleDot,
  CircleX,
  CloudRain,
  CloudSnow,
  Compass,
  Construction,
  Crosshair,
  Diamond,
  Dice1,
  DollarSignIcon,
  Droplet,
  FlaskConical,
  FlaskRound,
  FolderOpen,
  FolderSync,
  GitBranchPlus,
  GitMerge,
  GitPullRequest,
  Hexagon,
  Home,
  Inbox,
  Landmark,
  LayoutDashboard,
  Library,
  Lightbulb,
  LineChartIcon,
  Link,
  Loader,
  LogIn,
  LogOut,
  Mail,
  Map,
  MapPin,
  Megaphone,
  MessageCircle,
  Mic,
  Monitor,
  Moon,
  Mountain,
  Move,
  Music,
  Navigation,
  Network,
  Newspaper,
  Package2,
  Palette,
  Paperclip,
  PenTool,
  Phone,
  PieChart,
  Pin,
  Plane,
  PlugZap,
  Power,
  PowerOff,
  Printer,
  Radio,
  Receipt,
  Repeat,
  Reply,
  RocketIcon,
  Rss,
  Save,
  Scale,
  Scissors,
  ScrollText,
  Send,
  ServerCog,
  ServerCrash,
  Settings2,
  Share,
  Share2,
  ShieldAlert,
  ShieldOff,
  ShoppingBag,
  ShoppingCart,
  Shuffle,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  SignalZero,
  Skull,
  Slack,
  Sliders,
  Smartphone,
  Smile,
  Snowflake,
  Sparkle,
  Speaker,
  Square,
  SquareStack,
  Stamp,
  StarIcon,
  StickyNote,
  Sun,
  Sunrise,
  Sunset,
  Table,
  Tablet,
  Tag,
  Tags,
  Target as TargetIcon,
  Terminal,
  TestTube,
  TestTube2,
  ThermometerSnowflake,
  ThermometerSun,
  ThumbsDown,
  ThumbsUp,
  Timer as TimerIcon,
  ToggleLeft,
  ToggleRight,
  Trash,
  Trash2,
  TreePine,
  TrendingDown,
  Triangle,
  Truck,
  Tv,
  Twitch,
  Twitter,
  Type,
  Umbrella,
  Underline,
  Undo,
  Undo2,
  Unlink,
  Unlock,
  Upload as UploadIcon,
  User,
  UserCheck as UserCheckIcon,
  UserMinus,
  UserPlus,
  UserX,
  UsersIcon,
  Video,
  VideoOff,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  Wallet,
  Wand,
  Wand2,
  Watch,
  Waves,
  Webcam,
  Wifi,
  WifiOff,
  Wind,
  Wine,
  X as XIcon,
  Youtube,
  ZapIcon,
  ZapOff,
  Zoom,
  ZoomIn,
  ZoomOut
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

// Logo component placeholder - in production, these would be actual SVG/PNG logos
const Logo = ({ name, className }: { name: string; className?: string }) => {
  const logos: Record<string, React.ReactNode> = {
    // Databases
    'PostgreSQL': <Database className={cn("h-8 w-8 text-blue-600", className)} />,
    'MySQL': <Database className={cn("h-8 w-8 text-orange-600", className)} />,
    'MongoDB': <Layers className={cn("h-8 w-8 text-green-600", className)} />,
    'Snowflake': <Snowflake className={cn("h-8 w-8 text-cyan-600", className)} />,
    'BigQuery': <Database className={cn("h-8 w-8 text-blue-500", className)} />,
    'Oracle': <Database className={cn("h-8 w-8 text-red-600", className)} />,
    
    // SaaS
    'Salesforce': <Cloud className={cn("h-8 w-8 text-blue-500", className)} />,
    'HubSpot': <Megaphone className={cn("h-8 w-8 text-orange-500", className)} />,
    'Stripe': <CreditCard className={cn("h-8 w-8 text-purple-600", className)} />,
    'Zendesk': <MessageCircle className={cn("h-8 w-8 text-green-600", className)} />,
    'Slack': <Hash className={cn("h-8 w-8 text-purple-500", className)} />,
    'Jira': <CheckCircle className={cn("h-8 w-8 text-blue-600", className)} />,
    
    // Platform Capabilities
    'MLflow': <Microscope className={cn("h-8 w-8 text-blue-600", className)} />,
    'Ray': <Zap className={cn("h-8 w-8 text-blue-500", className)} />,
    'Apache Superset': <BarChart3 className={cn("h-8 w-8 text-teal-600", className)} />,
    'Jupyter': <BookOpen className={cn("h-8 w-8 text-orange-500", className)} />,
    'Apache Spark': <Sparkles className={cn("h-8 w-8 text-orange-600", className)} />,
    'Apache Kafka': <GitBranch className={cn("h-8 w-8 text-black dark:text-white", className)} />,
    'Apache Airflow': <Workflow className={cn("h-8 w-8 text-cyan-600", className)} />,
    'dbt': <GitMerge className={cn("h-8 w-8 text-orange-500", className)} />,
    'Grafana': <LineChart className={cn("h-8 w-8 text-orange-600", className)} />,
    'Prometheus': <Activity className={cn("h-8 w-8 text-orange-500", className)} />,
    'DataDog': <Shield className={cn("h-8 w-8 text-purple-600", className)} />,
    'Elasticsearch': <Search className={cn("h-8 w-8 text-green-500", className)} />,
    'Ranger': <ShieldCheck className={cn("h-8 w-8 text-green-600", className)} />,
    'Trino': <Database className={cn("h-8 w-8 text-blue-700", className)} />,
    
    // Storage
    'S3': <HardDrive className={cn("h-8 w-8 text-orange-600", className)} />,
    'SFTP': <FileText className={cn("h-8 w-8 text-gray-600", className)} />,
    'GCS': <Cloud className={cn("h-8 w-8 text-blue-500", className)} />,
    'Azure Blob': <Cloud className={cn("h-8 w-8 text-blue-600", className)} />,
  };

  return logos[name] || <Package className={cn("h-8 w-8 text-gray-500", className)} />;
};

// Types
interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'saas' | 'file' | 'api';
  category: string;
  status: 'active' | 'pending' | 'failed' | 'setup' | 'available';
  logo: string;
  description?: string;
  setupTime?: string;
  popularWith?: string[];
  lastConnectedBy?: { team: string; time: string };
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
  status: 'active' | 'available' | 'deploying' | 'included';
  logo: string;
  description: string;
  perfectFor?: string[];
  resourceImpact?: {
    cpu: string;
    memory: string;
    storage: string;
    autoScale?: string;
  };
  estimatedCost?: string;
  setupTime?: string;
  currentUsage?: {
    users: number;
    cpu?: string;
    memory?: string;
  };
  deploymentProgress?: number;
  integrations?: string[];
  documentation?: string;
  demo?: string;
}

export default function ConfigurePage() {
  const [activeTab, setActiveTab] = useState('capabilities');
  const [selectedCapability, setSelectedCapability] = useState<Capability | null>(null);
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [activatingCapability, setActivatingCapability] = useState<Capability | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<Record<string, number>>({});
  const [showResourceImpact, setShowResourceImpact] = useState(false);
  const [useSmartDefaults, setUseSmartDefaults] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for capabilities with activation-first approach
  const capabilities: Capability[] = [
    {
      id: 'dbt-core',
      name: 'dbt Core',
      category: 'Transformation',
      status: 'included',
      logo: 'dbt',
      description: 'Transform data with SQL',
      currentUsage: { users: 5 },
      integrations: ['Snowflake', 'PostgreSQL', 'BigQuery']
    },
    {
      id: 'spark',
      name: 'Apache Spark',
      category: 'Processing',
      status: 'active',
      logo: 'Apache Spark',
      description: 'Distributed data processing',
      currentUsage: { users: 8, cpu: '24 cores', memory: '96GB' },
      resourceImpact: {
        cpu: '24 cores',
        memory: '96GB',
        storage: '500GB',
        autoScale: 'Up to 100 cores'
      }
    },
    {
      id: 'mlflow',
      name: 'MLflow',
      category: 'ML & Analytics',
      status: 'deploying',
      logo: 'MLflow',
      description: 'Complete ML lifecycle management platform',
      perfectFor: [
        'ML teams training large models',
        'Experiment tracking and comparison',
        'Model registry and versioning'
      ],
      resourceImpact: {
        cpu: '4 cores',
        memory: '8GB',
        storage: '100GB',
        autoScale: 'Auto-expanding storage'
      },
      estimatedCost: '$399/month + $49/user',
      setupTime: '15 minutes',
      deploymentProgress: 67,
      integrations: ['Jupyter', 'Spark', 'Python'],
      documentation: 'https://mlflow.org/docs',
      demo: 'https://demo.mlflow.org'
    },
    {
      id: 'ray',
      name: 'Ray Distributed Computing',
      category: 'ML & Analytics',
      status: 'available',
      logo: 'Ray',
      description: 'Scale ML workloads and parallel computing',
      perfectFor: [
        'ML teams training models on >1GB datasets',
        'Data processing exceeding single-machine memory',
        'Parallel hyperparameter tuning'
      ],
      resourceImpact: {
        cpu: '8 cores',
        memory: '32GB',
        storage: '50GB',
        autoScale: 'Auto-scales to 100 cores'
      },
      estimatedCost: '~$0.50/compute hour',
      setupTime: '15 minutes',
      integrations: ['Jupyter', 'Spark', 'MLflow', 'Python'],
      documentation: 'https://docs.ray.io',
      demo: 'https://ray.io/demos'
    },
    {
      id: 'superset',
      name: 'Apache Superset',
      category: 'ML & Analytics',
      status: 'available',
      logo: 'Apache Superset',
      description: 'Modern business intelligence platform',
      perfectFor: [
        'Self-service analytics for business users',
        'Interactive dashboards and reports',
        'SQL exploration and visualization'
      ],
      resourceImpact: {
        cpu: '2 cores',
        memory: '4GB',
        storage: '50GB'
      },
      estimatedCost: '$299/month + $29/user',
      setupTime: '10 minutes',
      integrations: ['Trino', 'PostgreSQL', 'Snowflake'],
      documentation: 'https://superset.apache.org/docs',
      demo: 'https://superset.demo'
    },
    {
      id: 'jupyter',
      name: 'Jupyter Notebooks',
      category: 'ML & Analytics',
      status: 'available',
      logo: 'Jupyter',
      description: 'Interactive computing notebooks',
      perfectFor: [
        'Data exploration and visualization',
        'Collaborative analysis',
        'Prototyping ML models'
      ],
      resourceImpact: {
        cpu: '2 cores per user',
        memory: '4GB per user',
        storage: '20GB per user'
      },
      estimatedCost: '$199/month + $19/user',
      setupTime: '5 minutes',
      integrations: ['Spark', 'Ray', 'MLflow', 'Python', 'R'],
      documentation: 'https://jupyter.org/docs'
    },
    {
      id: 'grafana',
      name: 'Grafana',
      category: 'Monitoring',
      status: 'available',
      logo: 'Grafana',
      description: 'Observability and monitoring dashboards',
      perfectFor: [
        'Real-time system monitoring',
        'Custom metrics dashboards',
        'Alert management'
      ],
      resourceImpact: {
        cpu: '2 cores',
        memory: '4GB',
        storage: '100GB'
      },
      estimatedCost: '$99/month',
      setupTime: '10 minutes',
      integrations: ['Prometheus', 'Elasticsearch', 'DataDog'],
      documentation: 'https://grafana.com/docs'
    },
    {
      id: 'ranger',
      name: 'Apache Ranger',
      category: 'Security & Governance',
      status: 'available',
      logo: 'Ranger',
      description: 'Fine-grained access control and audit',
      perfectFor: [
        'Column-level security',
        'Dynamic data masking',
        'Compliance reporting'
      ],
      resourceImpact: {
        cpu: '2 cores',
        memory: '4GB',
        storage: '50GB'
      },
      estimatedCost: '$499/month',
      setupTime: '20 minutes',
      integrations: ['Trino', 'Spark', 'Kafka'],
      documentation: 'https://ranger.apache.org'
    }
  ];

  // Popular data sources
  const dataSources: DataSource[] = [
    {
      id: 'salesforce',
      name: 'Salesforce CRM',
      type: 'saas',
      category: 'SaaS Platforms',
      status: 'available',
      logo: 'Salesforce',
      description: 'Customer, lead, opportunity data',
      setupTime: '2 minutes',
      popularWith: ['Sales', 'Marketing'],
      lastConnectedBy: { team: 'Marketing', time: '2 days ago' }
    },
    {
      id: 'postgresql',
      name: 'PostgreSQL',
      type: 'database',
      category: 'Databases',
      status: 'active',
      logo: 'PostgreSQL',
      description: 'Relational database',
      setupTime: '3 minutes',
      metrics: {
        throughput: '2.5K rec/sec',
        lastSync: '2 minutes ago',
        uptime: '99.9%'
      }
    },
    {
      id: 'stripe',
      name: 'Stripe Payments',
      type: 'saas',
      category: 'SaaS Platforms',
      status: 'available',
      logo: 'Stripe',
      description: 'Transaction and customer payment data',
      setupTime: '2 minutes',
      popularWith: ['Finance', 'Analytics']
    },
    {
      id: 'snowflake',
      name: 'Snowflake',
      type: 'database',
      category: 'Databases',
      status: 'active',
      logo: 'Snowflake',
      description: 'Cloud data warehouse',
      setupTime: '5 minutes',
      metrics: {
        throughput: '45K rec/hour',
        lastSync: '1 hour ago',
        uptime: '100%'
      }
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      type: 'saas',
      category: 'SaaS Platforms',
      status: 'available',
      logo: 'HubSpot',
      description: 'Marketing automation and CRM',
      setupTime: '3 minutes',
      lastConnectedBy: { team: 'Marketing', time: '1 week ago' }
    },
    {
      id: 'mongodb',
      name: 'MongoDB',
      type: 'database',
      category: 'Databases',
      status: 'available',
      logo: 'MongoDB',
      description: 'NoSQL document database',
      setupTime: '3 minutes',
      lastConnectedBy: { team: 'Product', time: '2 weeks ago' }
    }
  ];

  // Simulate deployment progress
  useEffect(() => {
    const interval = setInterval(() => {
      setDeploymentStatus(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (updated[key] < 100) {
            updated[key] = Math.min(100, updated[key] + Math.random() * 10);
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleActivateCapability = (capability: Capability) => {
    setActivatingCapability(capability);
    setShowActivationDialog(true);
  };

  const confirmActivation = () => {
    if (activatingCapability) {
      setDeploymentStatus(prev => ({ ...prev, [activatingCapability.id]: 0 }));
      // Update capability status
      const updatedCapability = { ...activatingCapability, status: 'deploying' as const };
      setActivatingCapability(updatedCapability);
    }
    setShowActivationDialog(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'included':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'deploying':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'available':
        return <Circle className="h-5 w-5 text-gray-400" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'included':
        return <Badge className="bg-blue-100 text-blue-800">Included</Badge>;
      case 'deploying':
        return <Badge className="bg-yellow-100 text-yellow-800">Deploying</Badge>;
      case 'available':
        return <Badge className="bg-gray-100 text-gray-800">Available</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Calculate resource totals
  const currentResources = {
    cpu: 64,
    memory: 256,
    storage: 2048
  };

  const resourceUsage = {
    cpu: 45,
    memory: 67,
    storage: 35
  };

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-light tracking-tight">Configure</h1>
          <p className="text-muted-foreground mt-2">
            Activate capabilities and connect data sources to expand your platform
          </p>
        </div>

        {/* Resource Overview */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">CPU Cores</span>
                </div>
                <div className="text-2xl font-semibold">{currentResources.cpu}</div>
                <Progress value={resourceUsage.cpu} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">{resourceUsage.cpu}% utilized</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Memory</span>
                </div>
                <div className="text-2xl font-semibold">{currentResources.memory}GB</div>
                <Progress value={resourceUsage.memory} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">{resourceUsage.memory}% utilized</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Storage</span>
                </div>
                <div className="text-2xl font-semibold">{currentResources.storage}GB</div>
                <Progress value={resourceUsage.storage} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">{resourceUsage.storage}% utilized</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Health Status</span>
                </div>
                <div className="text-2xl font-semibold text-green-600">Healthy</div>
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">40% headroom available</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="capabilities" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Platform Capabilities
            </TabsTrigger>
            <TabsTrigger value="sources" className="gap-2">
              <Database className="h-4 w-4" />
              Data Sources
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Platform Capabilities Tab */}
          <TabsContent value="capabilities" className="space-y-6">
            {/* Active Capabilities */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Your Active Capabilities</h2>
              <div className="space-y-3">
                {capabilities.filter(c => ['active', 'included', 'deploying'].includes(c.status)).map(capability => (
                  <Card key={capability.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Logo name={capability.logo} className="h-10 w-10" />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-lg">{capability.name}</h3>
                              {getStatusBadge(capability.status)}
                            </div>
                            <p className="text-muted-foreground mb-3">{capability.description}</p>
                            
                            {capability.status === 'deploying' && (
                              <div className="space-y-2 mb-3">
                                <div className="flex items-center justify-between text-sm">
                                  <span>Deployment Progress</span>
                                  <span>{Math.round(deploymentStatus[capability.id] || capability.deploymentProgress || 0)}%</span>
                                </div>
                                <Progress 
                                  value={deploymentStatus[capability.id] || capability.deploymentProgress || 0} 
                                  className="h-2"
                                />
                                <p className="text-xs text-muted-foreground">
                                  ETA: {Math.round((100 - (deploymentStatus[capability.id] || capability.deploymentProgress || 0)) / 10)} minutes
                                </p>
                              </div>
                            )}

                            {capability.currentUsage && (
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {capability.currentUsage.users && (
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {capability.currentUsage.users} users
                                  </span>
                                )}
                                {capability.currentUsage.cpu && (
                                  <span className="flex items-center gap-1">
                                    <Cpu className="h-3 w-3" />
                                    {capability.currentUsage.cpu}
                                  </span>
                                )}
                                {capability.currentUsage.memory && (
                                  <span className="flex items-center gap-1">
                                    <MemoryStick className="h-3 w-3" />
                                    {capability.currentUsage.memory}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex gap-2 mt-3">
                              {capability.status === 'active' && (
                                <>
                                  <Button size="sm" variant="outline">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Manage
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    View Metrics
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Users className="h-4 w-4 mr-2" />
                                    Add Users
                                  </Button>
                                </>
                              )}
                              {capability.status === 'deploying' && (
                                <>
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Progress
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Logs
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {capability.status === 'active' && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-5 w-5" />
                              <span className="text-sm">Active</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Available Capabilities */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Available to Activate</h2>
              <div className="grid grid-cols-2 gap-4">
                {capabilities.filter(c => c.status === 'available').map(capability => (
                  <Card key={capability.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Logo name={capability.logo} className="h-12 w-12" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{capability.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{capability.description}</p>
                        </div>
                      </div>

                      {capability.perfectFor && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Perfect for:</p>
                          <ul className="space-y-1">
                            {capability.perfectFor.map((item, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {capability.resourceImpact && (
                        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Activity className="h-3 w-3" />
                            Resource Impact:
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Base:</span> {capability.resourceImpact.cpu}, {capability.resourceImpact.memory} RAM
                            </div>
                            {capability.resourceImpact.autoScale && (
                              <div>
                                <span className="text-muted-foreground">Scaling:</span> {capability.resourceImpact.autoScale}
                              </div>
                            )}
                          </div>
                          {capability.estimatedCost && (
                            <div className="mt-2 text-xs">
                              <span className="text-muted-foreground">Cost:</span> {capability.estimatedCost}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Rocket className="h-4 w-4" />
                          Ready in {capability.setupTime}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          className="flex-1"
                          onClick={() => handleActivateCapability(capability)}
                        >
                          Activate {capability.name}
                        </Button>
                        <Button variant="outline" size="icon">
                          <BookOpen className="h-4 w-4" />
                        </Button>
                        {capability.demo && (
                          <Button variant="outline" size="icon">
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Data Sources Tab */}
          <TabsContent value="sources" className="space-y-6">
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search data sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Browse All Sources
              </Button>
            </div>

            {/* Popular Sources */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Popular Data Sources</h2>
              <div className="grid grid-cols-3 gap-4">
                {dataSources.slice(0, 6).map(source => (
                  <Card key={source.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <Logo name={source.logo} className="h-12 w-12 mb-3" />
                        <h3 className="font-semibold">{source.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{source.description}</p>
                        
                        {source.status === 'active' ? (
                          <div className="mt-3 w-full">
                            <div className="flex items-center justify-center gap-1 text-green-600 mb-2">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-sm">Connected</span>
                            </div>
                            {source.metrics && (
                              <div className="text-xs text-muted-foreground">
                                {source.metrics.throughput} • {source.metrics.uptime} uptime
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-3 w-full">
                            <Button className="w-full" size="sm">
                              Connect in {source.setupTime}
                            </Button>
                            {source.lastConnectedBy && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {source.lastConnectedBy.team} connected {source.lastConnectedBy.time}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recently Connected */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Recently Connected by Your Organization</h2>
              <div className="space-y-2">
                {dataSources.filter(s => s.lastConnectedBy).map(source => (
                  <Card key={source.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Logo name={source.logo} className="h-8 w-8" />
                          <div>
                            <p className="font-medium">{source.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Connected by {source.lastConnectedBy?.team} {source.lastConnectedBy?.time}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>
                  Configure organization-wide settings and policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-scaling</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically scale resources based on demand
                      </p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Team Access</p>
                      <p className="text-sm text-muted-foreground">
                        Manage team permissions and access controls
                      </p>
                    </div>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Cost Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Set up budget alerts and spending limits
                      </p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Activation Dialog */}
        <Dialog open={showActivationDialog} onOpenChange={setShowActivationDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {activatingCapability && <Logo name={activatingCapability.logo} className="h-8 w-8" />}
                Activate {activatingCapability?.name}?
              </DialogTitle>
              <DialogDescription>
                Ready to add {activatingCapability?.name} to your platform
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium mb-2">This will:</p>
                <ul className="space-y-1">
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    Add {activatingCapability?.name} capability to your platform
                  </li>
                  {activatingCapability?.integrations && (
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      Integrate with {activatingCapability.integrations.join(', ')}
                    </li>
                  )}
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    Auto-configure for your team's environment
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    Include monitoring and logging
                  </li>
                </ul>
              </div>

              {activatingCapability?.resourceImpact && (
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Resource Addition:
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">CPU:</span> +{activatingCapability.resourceImpact.cpu}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Memory:</span> +{activatingCapability.resourceImpact.memory} RAM
                    </div>
                    <div>
                      <span className="text-muted-foreground">Storage:</span> +{activatingCapability.resourceImpact.storage}
                    </div>
                    {activatingCapability.resourceImpact.autoScale && (
                      <div>
                        <span className="text-muted-foreground">Auto-scale:</span> {activatingCapability.resourceImpact.autoScale}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Your cluster can handle this - you have 40% headroom
                    </div>
                  </div>
                </div>
              )}

              {useSmartDefaults && (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>Smart Defaults Applied</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>✓ Team access: Data Science team auto-added</li>
                      <li>✓ Integration: Connected to your existing tools</li>
                      <li>✓ Monitoring: Dashboard created in Grafana</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ready in: ~{activatingCapability?.setupTime}</span>
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => setUseSmartDefaults(!useSmartDefaults)}
                >
                  {useSmartDefaults ? 'Customize Settings' : 'Use Smart Defaults'}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowActivationDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmActivation}>
                Yes, Activate {activatingCapability?.name}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}