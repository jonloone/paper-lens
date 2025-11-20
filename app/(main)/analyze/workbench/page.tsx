'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function WorkbenchPage() {
  useEffect(() => {
    // Redirect to Data Formulator app on port 5000
    window.location.href = 'http://137.220.61.218:5000';
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Launching Data Workbench...</p>
      </div>
    </div>
  );
}
