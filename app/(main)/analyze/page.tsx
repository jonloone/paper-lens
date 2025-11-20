'use client';

import Link from 'next/link';
import { MessageSquare, BarChart3 } from 'lucide-react';

export default function AnalyzePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Analyze</h1>
          <p className="text-gray-600 mt-2">
            Query and visualize your data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Explore Card */}
          <Link href="/analyze/explore">
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Explore</h2>
                  <p className="text-gray-600 text-sm mb-4">
                    Ask questions about your data using natural language and productize queries
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Workbench Card */}
          <Link href="/analyze/workbench">
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Workbench</h2>
                  <p className="text-gray-600 text-sm mb-4">
                    Create rich visualizations with AI-powered data transformation
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
