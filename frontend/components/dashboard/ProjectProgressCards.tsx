"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowRight,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Package,
  Database,
  Code,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataProduct {
  id: string;
  name: string;
  description: string;
  type: 'dataset' | 'model' | 'report' | 'api';
  status: 'development' | 'testing' | 'production' | 'deprecated';
  progress: number;
  owner: {
    name: string;
    avatar?: string;
  };
  team: string[];
  metrics: {
    quality: number;
    freshness: 'real-time' | 'hourly' | 'daily' | 'weekly';
    consumers: number;
  };
  compliance: {
    odps: boolean;
    version: string;
  };
  lastUpdate: string;
  issues?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const mockProjects: DataProduct[] = [
  {
    id: '1',
    name: 'Customer 360 View',
    description: 'Unified customer data product with behavioral analytics',
    type: 'dataset',
    status: 'production',
    progress: 100,
    owner: { name: 'Sarah Chen', avatar: '/avatars/sarah.jpg' },
    team: ['John Doe', 'Alice Smith'],
    metrics: {
      quality: 98,
      freshness: 'hourly',
      consumers: 42
    },
    compliance: { odps: true, version: '4.0' },
    lastUpdate: '2 hours ago',
    priority: 'high'
  },
  {
    id: '2',
    name: 'Revenue Forecasting Model',
    description: 'ML model for quarterly revenue predictions',
    type: 'model',
    status: 'testing',
    progress: 75,
    owner: { name: 'Mark Johnson' },
    team: ['Emma Wilson', 'David Brown'],
    metrics: {
      quality: 92,
      freshness: 'daily',
      consumers: 15
    },
    compliance: { odps: true, version: '4.0' },
    lastUpdate: '1 day ago',
    issues: 3,
    priority: 'critical'
  },
  {
    id: '3',
    name: 'Inventory Optimization API',
    description: 'Real-time inventory management service',
    type: 'api',
    status: 'development',
    progress: 45,
    owner: { name: 'Lisa Park' },
    team: ['Michael Lee', 'Jennifer Wang'],
    metrics: {
      quality: 85,
      freshness: 'real-time',
      consumers: 0
    },
    compliance: { odps: false, version: '3.2' },
    lastUpdate: '3 hours ago',
    issues: 8,
    priority: 'medium'
  },
  {
    id: '4',
    name: 'Executive Dashboard',
    description: 'KPI reporting and business intelligence',
    type: 'report',
    status: 'production',
    progress: 100,
    owner: { name: 'Tom Anderson' },
    team: ['Rachel Green'],
    metrics: {
      quality: 95,
      freshness: 'daily',
      consumers: 28
    },
    compliance: { odps: true, version: '4.0' },
    lastUpdate: '6 hours ago',
    priority: 'low'
  }
];

const typeIcons = {
  dataset: Database,
  model: Code,
  report: BarChart3,
  api: Package
};

const statusColors = {
  development: 'bg-blue-500',
  testing: 'bg-yellow-500',
  production: 'bg-green-500',
  deprecated: 'bg-gray-500'
};

const priorityConfig = {
  low: { color: 'text-gray-500', badge: 'secondary' },
  medium: { color: 'text-blue-500', badge: 'default' },
  high: { color: 'text-orange-500', badge: 'default' },
  critical: { color: 'text-red-500', badge: 'destructive' }
};

export function ProjectProgressCards() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Active Data Products</h2>
          <p className="text-sm text-muted-foreground mt-1">
            ODPS v4.0 compliant products in your organization
          </p>
        </div>
        <Button>
          View All Products
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mockProjects.map((project) => {
          const TypeIcon = typeIcons[project.type];
          const priorityStyle = priorityConfig[project.priority];

          return (
            <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      {project.compliance.odps && (
                        <Badge variant="outline" className="text-xs">
                          ODPS {project.compliance.version}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{project.description}</CardDescription>
                  </div>
                  <Badge variant={priorityStyle.badge as any}>
                    {project.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Quality</p>
                    <div className="flex items-center gap-1">
                      {project.metrics.quality >= 95 ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      ) : project.metrics.quality >= 85 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-yellow-500" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      )}
                      <span className="font-medium">{project.metrics.quality}%</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Freshness</p>
                    <p className="font-medium capitalize">{project.metrics.freshness}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Consumers</p>
                    <p className="font-medium">{project.metrics.consumers}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={project.owner.avatar} />
                      <AvatarFallback>{project.owner.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{project.owner.name}</span>
                    {project.team.length > 0 && (
                      <>
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">+{project.team.length}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {project.issues && project.issues > 0 && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {project.issues} issues
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {project.lastUpdate}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}