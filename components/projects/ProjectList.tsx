"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  MoreVertical,
  Database,
  Code,
  BarChart3,
  Package,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
  GitBranch,
  Activity
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string;
  type: 'dataset' | 'model' | 'report' | 'api';
  status: 'active' | 'development' | 'archived' | 'template';
  odps: {
    compliant: boolean;
    version: string;
    score: number;
  };
  metadata: {
    owner: string;
    team: string[];
    created: string;
    lastModified: string;
    dataSource: string[];
    tags: string[];
  };
  metrics: {
    quality: number;
    completeness: number;
    freshness: string;
    consumers: number;
    issues: number;
  };
  deployment: {
    environment: 'dev' | 'staging' | 'prod';
    lastDeployment: string;
    version: string;
  };
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Customer 360 Analytics',
    description: 'Unified customer data product combining CRM, transaction, and behavioral data',
    type: 'dataset',
    status: 'active',
    odps: {
      compliant: true,
      version: '4.0',
      score: 98
    },
    metadata: {
      owner: 'Sarah Chen',
      team: ['John Doe', 'Alice Smith'],
      created: '2024-01-15',
      lastModified: '2024-03-20',
      dataSource: ['CRM', 'Transactions', 'Web Analytics'],
      tags: ['customer', 'analytics', 'priority']
    },
    metrics: {
      quality: 98,
      completeness: 95,
      freshness: 'hourly',
      consumers: 42,
      issues: 0
    },
    deployment: {
      environment: 'prod',
      lastDeployment: '2024-03-20T10:30:00Z',
      version: 'v2.3.1'
    }
  },
  {
    id: '2',
    name: 'Revenue Forecasting Model',
    description: 'Machine learning model for quarterly revenue predictions with 94% accuracy',
    type: 'model',
    status: 'active',
    odps: {
      compliant: true,
      version: '4.0',
      score: 92
    },
    metadata: {
      owner: 'Mark Johnson',
      team: ['Emma Wilson', 'David Brown'],
      created: '2024-02-01',
      lastModified: '2024-03-18',
      dataSource: ['Sales Data', 'Market Indicators'],
      tags: ['ml', 'forecasting', 'finance']
    },
    metrics: {
      quality: 92,
      completeness: 88,
      freshness: 'daily',
      consumers: 15,
      issues: 2
    },
    deployment: {
      environment: 'prod',
      lastDeployment: '2024-03-18T14:20:00Z',
      version: 'v1.5.0'
    }
  },
  {
    id: '3',
    name: 'Inventory Optimization API',
    description: 'Real-time inventory management service with demand forecasting',
    type: 'api',
    status: 'development',
    odps: {
      compliant: false,
      version: '3.2',
      score: 75
    },
    metadata: {
      owner: 'Lisa Park',
      team: ['Michael Lee', 'Jennifer Wang'],
      created: '2024-03-01',
      lastModified: '2024-03-21',
      dataSource: ['Inventory DB', 'Supply Chain'],
      tags: ['api', 'real-time', 'operations']
    },
    metrics: {
      quality: 85,
      completeness: 70,
      freshness: 'real-time',
      consumers: 0,
      issues: 8
    },
    deployment: {
      environment: 'dev',
      lastDeployment: '2024-03-21T09:15:00Z',
      version: 'v0.8.2'
    }
  }
];

const typeIcons = {
  dataset: Database,
  model: Code,
  report: BarChart3,
  api: Package
};

const environmentColors = {
  dev: 'bg-blue-500',
  staging: 'bg-yellow-500',
  prod: 'bg-green-500'
};

interface ProjectListProps {
  viewMode: 'grid' | 'list';
  filter: string;
}

export function ProjectList({ viewMode, filter }: ProjectListProps) {
  const filteredProjects = mockProjects.filter(p => {
    if (filter === 'active') return p.status === 'active';
    if (filter === 'development') return p.status === 'development';
    if (filter === 'archived') return p.status === 'archived';
    if (filter === 'templates') return p.status === 'template';
    return true;
  });

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredProjects.map((project) => (
        <ProjectListItem key={project.id} project={project} />
      ))}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const TypeIcon = typeIcons[project.type];

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TypeIcon className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-lg">{project.name}</CardTitle>
            </div>
            <CardDescription className="line-clamp-2">
              {project.description}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit Configuration</DropdownMenuItem>
              <DropdownMenuItem>View Lineage</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Clone Project</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ODPS Compliance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className={cn(
              "h-4 w-4",
              project.odps.compliant ? "text-green-500" : "text-yellow-500"
            )} />
            <span className="text-sm">
              ODPS {project.odps.version}
            </span>
          </div>
          <Badge variant={project.odps.compliant ? "default" : "secondary"}>
            {project.odps.score}% compliant
          </Badge>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Quality</p>
            <div className="flex items-center gap-1">
              {project.metrics.quality >= 95 ? (
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
              )}
              <span className="font-medium">{project.metrics.quality}%</span>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground">Consumers</p>
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{project.metrics.consumers}</span>
            </div>
          </div>
        </div>

        {/* Environment Status */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              environmentColors[project.deployment.environment]
            )} />
            <span className="text-sm capitalize">
              {project.deployment.environment}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <GitBranch className="h-3 w-3" />
            {project.deployment.version}
          </div>
        </div>

        {/* Issues */}
        {project.metrics.issues > 0 && (
          <Badge variant="destructive" className="w-full justify-center">
            {project.metrics.issues} issues need attention
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function ProjectListItem({ project }: { project: Project }) {
  const TypeIcon = typeIcons[project.type];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className={cn(
              "p-3 rounded-lg bg-muted",
            )}>
              <TypeIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{project.name}</h3>
                {project.odps.compliant && (
                  <Badge variant="outline">
                    ODPS {project.odps.version}
                  </Badge>
                )}
                <Badge className={cn(
                  "capitalize",
                  environmentColors[project.deployment.environment].replace('bg-', 'bg-opacity-20 text-')
                )}>
                  {project.deployment.environment}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {project.description}
              </p>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-muted-foreground">
                  Owner: <span className="text-foreground">{project.metadata.owner}</span>
                </span>
                <span className="text-muted-foreground">
                  Updated: <span className="text-foreground">
                    {new Date(project.metadata.lastModified).toLocaleDateString()}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Quality: <span className="text-foreground">{project.metrics.quality}%</span>
                </span>
                <span className="text-muted-foreground">
                  Consumers: <span className="text-foreground">{project.metrics.consumers}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {project.metrics.issues > 0 && (
              <Badge variant="destructive">
                {project.metrics.issues} issues
              </Badge>
            )}
            <Button variant="outline" size="sm">
              View Details
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>Edit Configuration</DropdownMenuItem>
                <DropdownMenuItem>View Lineage</DropdownMenuItem>
                <DropdownMenuItem>Deploy to Production</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Clone Project</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Archive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}