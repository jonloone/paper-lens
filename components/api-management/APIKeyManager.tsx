'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Key,
  Copy,
  Check,
  Trash2,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  AlertCircle
} from 'lucide-react';

interface APIKey {
  id: string;
  name: string;
  key: string;
  description?: string;
  createdAt: Date;
  expiresAt?: Date;
  lastUsed?: Date;
  status: 'active' | 'expired' | 'revoked';
  permissions: string[];
}

export function APIKeyManager() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: '1',
      name: 'Default for product.test_api_eng_4',
      key: '••••••••••••••••••••062e',
      description: 'Product test API engineering v4',
      createdAt: new Date('2025-05-14T12:00:00'),
      expiresAt: new Date('2025-06-14T12:00:00'),
      lastUsed: new Date(Date.now() - 3600000),
      status: 'active',
      permissions: ['read', 'write']
    },
    {
      id: '2',
      name: 'Default for product.employees_full_api',
      key: '••••••••••••••••••••9fc1',
      description: 'Full employee data access',
      createdAt: new Date('2025-05-14T12:17:00'),
      lastUsed: new Date(Date.now() - 7200000),
      status: 'active',
      permissions: ['read']
    },
    {
      id: '3',
      name: 'Default for product.hr_api_employees',
      key: '••••••••••••••••••••7e97',
      description: 'HR employee API access',
      createdAt: new Date('2025-05-14T12:45:00'),
      status: 'active',
      permissions: ['read', 'write', 'delete']
    },
    {
      id: '4',
      name: 'Default for product.hr_api_employees_2',
      key: '••••••••••••••••••••0292',
      description: 'HR employee API v2',
      createdAt: new Date('2025-05-14T13:00:00'),
      expiresAt: new Date('2025-06-14T13:00:00'),
      status: 'expired',
      permissions: ['read']
    },
    {
      id: '5',
      name: 'Default for product.min_n',
      key: '••••••••••••••••••••d83c',
      description: 'Minimal product data',
      createdAt: new Date('2025-05-10T07:52:00'),
      lastUsed: new Date(Date.now() - 86400000),
      status: 'active',
      permissions: ['read']
    },
    {
      id: '6',
      name: 'Default for product.sales',
      key: '••••••••••••••••••••4702',
      description: 'Sales data API',
      createdAt: new Date('2025-05-10T08:39:00'),
      status: 'active',
      permissions: ['read', 'write']
    },
    {
      id: '7',
      name: 'Default for RESTFUL-1311-478d',
      key: '••••••••••••••••••••d23b',
      description: 'RESTful API for brand data',
      createdAt: new Date('2025-05-10T05:37:00'),
      lastUsed: new Date(Date.now() - 172800000),
      status: 'active',
      permissions: ['read']
    },
    {
      id: '8',
      name: 'Default for sales_data.calims_api',
      key: '••••••••••••••••••••d9fa',
      description: 'Sales claims API',
      createdAt: new Date('2025-05-07T05:49:00'),
      status: 'active',
      permissions: ['read', 'write']
    },
    {
      id: '9',
      name: 'Default for sales_data.malomalta_api',
      key: '••••••••••••••••••••5d25',
      description: 'Malomalta sales data',
      createdAt: new Date('2025-07-02T06:29:00'),
      status: 'active',
      permissions: ['read']
    },
    {
      id: '10',
      name: 'Default for sales_data.demo_api_bank',
      key: '••••••••••••••••••••ed83',
      description: 'Demo bank API',
      createdAt: new Date('2025-06-08T07:53:00'),
      lastUsed: new Date(Date.now() - 10800000),
      status: 'active',
      permissions: ['read']
    },
    {
      id: '11',
      name: 'Default for sales_data.demo_bank_query2',
      key: '••••••••••••••••••••794e',
      description: 'Bank query API v2',
      createdAt: new Date('2025-06-08T07:52:00'),
      lastUsed: new Date(Date.now() - 21600000),
      status: 'active',
      permissions: ['read', 'write']
    },
    {
      id: '12',
      name: 'API Test',
      key: '••••••••••••••••••••e684',
      description: 'Testing API key',
      createdAt: new Date('2025-08-22T13:04:00'),
      expiresAt: new Date('2025-09-22T13:04:00'),
      lastUsed: new Date(Date.now() - 518400000),
      status: 'active',
      permissions: ['read']
    }
  ]);

  const [showKey, setShowKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('30');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredKeys = apiKeys.filter(key =>
    key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyKey = async (key: APIKey) => {
    // In production, this would decrypt the actual key
    const actualKey = `nx1_${Math.random().toString(36).substring(2)}`;
    await navigator.clipboard.writeText(actualKey);
    setCopiedId(key.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateKey = () => {
    const expiryDays = parseInt(newKeyExpiry);
    const expiresAt = expiryDays > 0 
      ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
      : undefined;

    const newKey: APIKey = {
      id: Math.random().toString(36).substring(2),
      name: newKeyName,
      key: `••••••••••••••••••••${Math.random().toString(36).substring(2, 6)}`,
      description: newKeyDescription,
      createdAt: new Date(),
      expiresAt,
      status: 'active',
      permissions: ['read', 'write']
    };

    setApiKeys([newKey, ...apiKeys]);
    setIsCreateDialogOpen(false);
    setNewKeyName('');
    setNewKeyDescription('');
    setNewKeyExpiry('30');
  };

  const handleDeleteKey = (keyId: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== keyId));
  };

  const getStatusBadge = (key: APIKey) => {
    if (key.status === 'expired' || (key.expiresAt && key.expiresAt < new Date())) {
      return <Badge variant="destructive" className="text-xs">Expired</Badge>;
    }
    if (key.status === 'revoked') {
      return <Badge variant="outline" className="text-xs">Revoked</Badge>;
    }
    return <Badge variant="default" className="text-xs">Active</Badge>;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Data API Keys</h2>
          <p className="text-muted-foreground">Manage your API authentication keys</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate New Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for accessing data endpoints
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Key Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Production API Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="What is this key used for?"
                  value={newKeyDescription}
                  onChange={(e) => setNewKeyDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiration</Label>
                <Select value={newKeyExpiry} onValueChange={setNewKeyExpiry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="0">Never expires</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateKey} disabled={!newKeyName}>
                Generate Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by description or key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Keys</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys ({filteredKeys.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-sm">Description</th>
                  <th className="pb-3 px-4 font-medium text-sm">Key</th>
                  <th className="pb-3 px-4 font-medium text-sm">Date API Created</th>
                  <th className="pb-3 px-4 font-medium text-sm">Valid For</th>
                  <th className="pb-3 px-4 font-medium text-sm">Status</th>
                  <th className="pb-3 px-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeys.map((apiKey) => (
                  <tr key={apiKey.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3">
                      <div>
                        <div className="font-medium text-sm">{apiKey.name}</div>
                        {apiKey.description && (
                          <div className="text-xs text-muted-foreground">{apiKey.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm">
                          {showKey === apiKey.id ? 'nx1_' + apiKey.key.slice(-4) + '...' : apiKey.key}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                        >
                          {showKey === apiKey.id ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {formatDate(apiKey.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      {apiKey.expiresAt ? (
                        <div className="text-sm">
                          <div>{formatDate(apiKey.expiresAt)}</div>
                          {apiKey.lastUsed && (
                            <div className="text-xs text-muted-foreground">
                              Last used: {getTimeAgo(apiKey.lastUsed)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never expires</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(apiKey)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyKey(apiKey)}
                        >
                          {copiedId === apiKey.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button size="sm" variant="ghost">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteKey(apiKey.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>Rows per page: 10</span>
            <span>Page 1 of 1</span>
          </div>
        </CardContent>
      </Card>

      {/* Usage Warning */}
      <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">API Key Security</p>
              <p className="text-sm text-muted-foreground mt-1">
                Never share your API keys publicly. Rotate keys regularly and revoke unused keys to maintain security.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Search({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="24"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}