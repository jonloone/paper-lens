import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Database,
  Zap,
  GitBranch,
  Shield,
  Activity,
  Cloud,
  Calendar,
  Globe,
  Filter,
  Calculator,
  Layers,
  Package,
  BarChart3,
  Users,
  Cpu,
  HardDrive,
  Sparkles
} from 'lucide-react';

interface PaletteItem {
  type: string;
  label: string;
  icon: React.ElementType;
  description: string;
  category: string;
}

const paletteItems: PaletteItem[] = [
  // Data Sources
  {
    type: 'dataSource',
    label: 'Streaming Source',
    icon: Zap,
    description: 'Real-time data streams (Kafka, Kinesis)',
    category: 'Sources'
  },
  {
    type: 'dataSource',
    label: 'Batch Source',
    icon: Calendar,
    description: 'Scheduled batch data (S3, HDFS)',
    category: 'Sources'
  },
  {
    type: 'dataSource',
    label: 'Database',
    icon: Database,
    description: 'Relational or NoSQL database',
    category: 'Sources'
  },
  {
    type: 'dataSource',
    label: 'API Source',
    icon: Globe,
    description: 'REST or GraphQL API',
    category: 'Sources'
  },
  
  // Transformations
  {
    type: 'transform',
    label: 'Filter',
    icon: Filter,
    description: 'Filter rows based on conditions',
    category: 'Transform'
  },
  {
    type: 'transform',
    label: 'Aggregate',
    icon: Calculator,
    description: 'Group and aggregate data',
    category: 'Transform'
  },
  {
    type: 'transform',
    label: 'Join/Enrich',
    icon: Layers,
    description: 'Join with reference data',
    category: 'Transform'
  },
  {
    type: 'transform',
    label: 'ML Transform',
    icon: Sparkles,
    description: 'Apply ML models',
    category: 'Transform'
  },
  
  // Quality
  {
    type: 'quality',
    label: 'Quality Gate',
    icon: Shield,
    description: 'Data quality validation',
    category: 'Quality'
  },
  
  // Sinks
  {
    type: 'sink',
    label: 'Data Lake',
    icon: Cloud,
    description: 'Store in data lake (Iceberg, Delta)',
    category: 'Destinations'
  },
  {
    type: 'sink',
    label: 'Data Warehouse',
    icon: Package,
    description: 'Load to warehouse (Snowflake, BQ)',
    category: 'Destinations'
  },
  {
    type: 'sink',
    label: 'Database',
    icon: HardDrive,
    description: 'Write to operational database',
    category: 'Destinations'
  },
  
  // Consumers
  {
    type: 'consumer',
    label: 'Dashboard',
    icon: BarChart3,
    description: 'BI dashboards and reports',
    category: 'Consumers'
  },
  {
    type: 'consumer',
    label: 'API Endpoint',
    icon: Globe,
    description: 'Expose as REST API',
    category: 'Consumers'
  },
  {
    type: 'consumer',
    label: 'ML Pipeline',
    icon: Cpu,
    description: 'Feed ML models',
    category: 'Consumers'
  },
  {
    type: 'consumer',
    label: 'Application',
    icon: Users,
    description: 'Business applications',
    category: 'Consumers'
  }
];

const ToolPalette: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('nodeType', nodeType);
    event.dataTransfer.setData('label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  const categories = [...new Set(paletteItems.map(item => item.category))];

  return (
    <div className="h-full overflow-auto">
      <div className="mb-4">
        <h3 className="font-semibold text-sm mb-2">Pipeline Components</h3>
        <p className="text-xs text-muted-foreground">
          Drag components to the canvas to build your pipeline
        </p>
      </div>

      {categories.map(category => (
        <div key={category} className="mb-6">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {category}
          </h4>
          <div className="space-y-2">
            {paletteItems
              .filter(item => item.category === category)
              .map((item, idx) => (
                <div
                  key={`${category}-${idx}`}
                  className="p-3 bg-white border rounded-lg cursor-move hover:shadow-md transition-shadow"
                  draggable
                  onDragStart={(e) => onDragStart(e, item.type, item.label)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">💡 Pro Tip</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Focus on <strong>what</strong> you want to achieve, not <strong>how</strong>. 
            NexusOne will automatically select the best tools (NiFi, Airflow, Spark) 
            for each component based on your requirements.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ToolPalette;