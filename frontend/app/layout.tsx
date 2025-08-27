import type { Metadata } from 'next';
import Script from 'next/script';
import ServiceWorkerProvider from '@/components/ServiceWorkerProvider';
import { CopilotKit } from '@copilotkit/react-core';
import '@copilotkit/react-ui/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'NexusOne GeoCore | Intelligence Platform',
  description: 'Domain-agnostic geospatial intelligence platform with ML-powered insights',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="text-white font-sans" suppressHydrationWarning>
        <CopilotKit runtimeUrl="/api/copilot">
          <ServiceWorkerProvider>
            {children}
          </ServiceWorkerProvider>
        </CopilotKit>
      </body>
    </html>
  );
}