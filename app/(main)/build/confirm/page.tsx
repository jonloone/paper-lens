'use client';

import { useSearchParams } from 'next/navigation';
import { ContextConfirmation } from '@/components/build/ContextConfirmation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function ConfirmPageContent() {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get('data');

  if (!dataParam) {
    return (
      <div className="container mx-auto py-16 text-center">
        <p className="text-muted-foreground">No context data found. Please start from the beginning.</p>
      </div>
    );
  }

  try {
    const context = JSON.parse(decodeURIComponent(dataParam));

    return (
      <div className="container mx-auto py-8 px-4">
        <ContextConfirmation context={context} />
      </div>
    );
  } catch (error) {
    return (
      <div className="container mx-auto py-16 text-center">
        <p className="text-destructive">Failed to parse context data. Please try again.</p>
      </div>
    );
  }
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ConfirmPageContent />
    </Suspense>
  );
}
