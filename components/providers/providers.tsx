'use client';

import { ThemeProvider } from 'next-themes';
import ServiceWorkerProvider from '@/components/ServiceWorkerProvider';
import { ViewModeProvider } from '@/contexts/ViewModeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="dark" 
      enableSystem={true}
      disableTransitionOnChange
    >
      <ServiceWorkerProvider>
        <ViewModeProvider>
          {children}
        </ViewModeProvider>
      </ServiceWorkerProvider>
    </ThemeProvider>
  );
}