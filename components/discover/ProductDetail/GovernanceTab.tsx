'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Database,
  ArrowRight,
  Users,
  Mail,
  MessageSquare,
  CheckCircle,
  Lock,
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import { TechLogo } from '@/components/ui/tech-logo';

interface GovernanceTabProps {
  product: any;
}

export function GovernanceTab({ product }: GovernanceTabProps) {
  const sourceSystems = [
    { name: 'Salesforce CRM', logo: 'salesforce', lastSync: '2 hours ago', status: 'healthy' },
    { name: 'Stripe', logo: 'stripe', lastSync: '2 hours ago', status: 'healthy' },
    { name: 'Zendesk', logo: 'zendesk', lastSync: '3 hours ago', status: 'healthy' },
    { name: 'Google Analytics', logo: 'google-analytics', lastSync: '2 hours ago', status: 'healthy' },
  ];

  const dataFlow = [
    { step: 'Source CDC', description: 'Real-time change data capture from source systems' },
    { step: 'dbt Transform', description: 'Data modeling and transformation in dbt Cloud' },
    { step: 'Snowflake', description: 'Data warehouse storage and query engine' },
    { step: 'Quality Gates', description: 'Automated quality validation before publishing' },
  ];

  const governanceStatus = {
    piiCompliant: true,
    gdprReady: true,
    soc2Certified: true,
    hipaaCompliant: false,
    dataClassification: 'Confidential',
    retentionPolicy: '7 years',
  };

  const ownership = {
    team: 'Customer Analytics Team',
    technicalOwner: 'Sarah Chen',
    businessOwner: 'Mike Johnson',
    email: 'customer-analytics@company.com',
    slackChannel: '#data-customer-analytics',
    onCallRotation: 'PagerDuty: Customer Data',
  };

  const piiFields = [
    { field: 'email', classification: 'PII', masked: 'Available with approval' },
    { field: 'phone_number', classification: 'PII', masked: 'Available with approval' },
    { field: 'billing_address', classification: 'PII', masked: 'Available with approval' },
    { field: 'first_name', classification: 'PII', masked: 'No' },
    { field: 'last_name', classification: 'PII', masked: 'No' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Source Systems Data Lineage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-3">Source Systems</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sourceSystems.map((source) => (
                <div key={source.name} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-center h-12">
                    <TechLogo tech={source.logo} className="h-8 w-8" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm">{source.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Last sync: {source.lastSync}
                    </div>
                    <Badge
                      variant={source.status === 'healthy' ? 'default' : 'destructive'}
                      className="mt-2 text-xs"
                    >
                      {source.status === 'healthy' ? 'Healthy' : 'Issues'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ownership Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-3">Team Information</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team:</span>
                  <span className="font-medium">{ownership.team}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Technical Owner:</span>
                  <span className="font-medium">{ownership.technicalOwner}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Business Owner:</span>
                  <span className="font-medium">{ownership.businessOwner}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-3">Contact Channels</div>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
                  <a href={`mailto:${ownership.email}`}>
                    <Mail className="h-3 w-3" />
                    {ownership.email}
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <MessageSquare className="h-3 w-3" />
                  {ownership.slackChannel}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-3">Compliance Status</div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                PII Compliant
              </Badge>
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                GDPR Ready
              </Badge>
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                SOC 2 Type II
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
