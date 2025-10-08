'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { DataProductCreationFlow } from '@/components/build/DataProductCreationFlow';

export default function NewDataProductPage() {
  const params = useParams();
  const domainId = params.domainId as string;

  return (
    <div className="w-full px-8 lg:px-12 xl:px-16 py-6">
      <div className="space-y-6 max-w-[1920px] mx-auto">
        <DataProductCreationFlow domainId={domainId} />
      </div>
    </div>
  );
}