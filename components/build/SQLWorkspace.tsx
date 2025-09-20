'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowRight,
  Database,
  ExternalLink,
  Sparkles,
  Zap,
  FileCode,
  Brain
} from 'lucide-react';

export function SQLWorkspace() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Upgrade Notice */}
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <strong>SQL Workspace has been upgraded to Query Studio!</strong> 
          Experience the new professional SQL development environment with AI assistance, advanced query management, and TiSQLEditor integration.
        </AlertDescription>
      </Alert>

      {/* Main Upgrade Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Database className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to Query Studio</CardTitle>
          <CardDescription className="text-lg">
            Professional SQL development with AI-powered assistance
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Brain className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold mb-1">AI Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Natural language to SQL generation with intelligent optimization
              </p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <FileCode className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold mb-1">TiSQLEditor</h3>
              <p className="text-sm text-muted-foreground">
                Professional code editor with syntax highlighting and autocompletion
              </p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Zap className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <h3 className="font-semibold mb-1">Query Library</h3>
              <p className="text-sm text-muted-foreground">
                Save, organize, and share queries with advanced search and filtering
              </p>
            </div>
          </div>

          {/* Upgrade Benefits */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-primary" />
              What's New in Query Studio
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>AI-powered SQL generation and optimization</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Professional TiSQLEditor with advanced features</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Comprehensive query library management</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Rich schema browser with table metadata</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Keyboard shortcuts for power users</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Seamless pipeline integration</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              size="lg" 
              className="flex items-center gap-2"
              onClick={() => window.open('/query', '_self')}
            >
              <Database className="h-5 w-5" />
              Open Query Studio
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => window.open('/query', '_blank')}
            >
              <ExternalLink className="h-5 w-5" />
              Open in New Tab
            </Button>
          </div>

          {/* URL Note */}
          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            <p>
              Query Studio is also available directly at{' '}
              <code className="bg-muted px-2 py-1 rounded font-mono">/query</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}