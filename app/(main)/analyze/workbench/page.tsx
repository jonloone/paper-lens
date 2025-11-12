'use client';

import { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

export default function WorkbenchPage() {
  useEffect(() => {
    // Automatically open in new tab
    window.open('http://137.220.61.218:5000', '_blank');
    // Redirect back to analyze page
    window.location.href = '/analyze';
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md text-center p-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExternalLink className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Opening Workbench...</h1>
        <p className="text-gray-600 mb-6">
          Data Workbench is opening in a new tab. If it doesn't open automatically, click the button below.
        </p>
        <a
          href="http://137.220.61.218:5000"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Open Data Workbench
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
