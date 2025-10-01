'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Box, Construction } from 'lucide-react';

export default function DomainContextPage() {
  const router = useRouter();

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        <Card className="p-6 border-blue-200 bg-blue-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold">Domain Product</div>
                <Badge variant="outline" className="text-xs">Coming Soon</Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/build')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Build Hub
            </Button>
          </div>
        </Card>

        <div className="text-center space-y-6 py-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 mb-4">
            <Construction className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold">Domain Products Coming Soon</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Domain Products allow you to model canonical business entities like Customer, Order, or Product with rich business context and governance.
          </p>

          <Card className="p-6 text-left max-w-2xl mx-auto">
            <h3 className="font-semibold mb-4">Planned Features:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Define business glossary terms and relationships</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Map multiple source tables to canonical entities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Apply domain-specific governance policies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Generate multiple derived data products</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Maintain golden records across systems</span>
              </li>
            </ul>
          </Card>

          <div className="flex items-center justify-center gap-4 pt-6">
            <Button onClick={() => router.push('/build')} variant="outline">
              Back to Build Hub
            </Button>
            <Button onClick={() => router.push('/build/composable/problem')} className="bg-green-600 hover:bg-green-700">
              Try Composable Products
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
