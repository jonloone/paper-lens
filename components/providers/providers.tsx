'use client';

import { ThemeProvider } from 'next-themes';
import ServiceWorkerProvider from '@/components/ServiceWorkerProvider';
import { ViewModeProvider } from '@/contexts/ViewModeContext';
import { CopilotKit } from '@copilotkit/react-core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import '@copilotkit/react-ui/styles.css';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30000, // 30 seconds
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        themes={['light', 'dark', 'nexus-enhanced', 'dracula', 'solarized-light', 'solarized-dark', 'one-dark-pro', 'gruvbox-light', 'gruvbox-dark', 'nature-light', 'nature-dark', 'amethyst-haze-light', 'amethyst-haze-dark', 'win98', 'modus', 'modus-light']}
        enableSystem={false}
        storageKey="nexusone-theme"
        disableTransitionOnChange
      >
        <CopilotKit
          runtimeUrl="/api/copilotkit"
          showDevConsole={false}
        >
          <ServiceWorkerProvider>
            <ViewModeProvider>
              {children}
            </ViewModeProvider>
          </ServiceWorkerProvider>
        </CopilotKit>
      </ThemeProvider>
    </QueryClientProvider>
  );
}