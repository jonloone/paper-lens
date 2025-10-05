'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Globe, Zap, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface APIConfigurationStepProps {
  workflowData: any;
  onComplete: (data: any) => void;
  uiConfig?: any;
}

export function APIConfigurationStep({ workflowData, onComplete, uiConfig }: APIConfigurationStepProps) {
  const [apiEndpoints] = useState([
    {
      id: '1',
      path: '/api/v1/sales/summary',
      method: 'GET',
      query: 'SELECT region, SUM(amount) FROM transactions GROUP BY region',
      cache: '5 minutes',
      rateLimit: '100 req/min'
    },
    {
      id: '2',
      path: '/api/v1/sales/details',
      method: 'GET',
      query: 'SELECT * FROM transactions WHERE date >= :start_date',
      cache: '1 minute',
      rateLimit: '50 req/min'
    }
  ]);

  const handleContinue = () => {
    onComplete({ apiEndpoints, apiConfig: { caching: true, rateLimiting: true } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Step 4: API Configuration</h2>
        <p className="text-muted-foreground">
          Configure Trino-powered API endpoints for your data product.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Generated API Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiEndpoints.map((endpoint) => (
            <div key={endpoint.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{endpoint.method}</Badge>
                  <code className="text-sm font-mono">{endpoint.path}</code>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    {endpoint.cache}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    {endpoint.rateLimit}
                  </Badge>
                </div>
              </div>
              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                <code>{endpoint.query}</code>
              </pre>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleContinue} size="lg">
          Continue to Deployment
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}