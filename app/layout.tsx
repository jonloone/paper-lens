import type { Metadata } from 'next';
import { Providers } from '@/components/providers/providers';
import { Navigation } from '@/components/layout/Navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'NexusOne | Ecosystem Control Platform',
  description: 'Mission control center for enterprise data operations - see everything, fix everything, deploy everything',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('nexusone-theme') || 'dark';
                  const root = document.documentElement;

                  // Remove all possible theme classes
                  const allThemes = ['light', 'dark', 'dracula', 'solarized-light', 'solarized-dark', 'one-dark-pro', 'gruvbox', 'gruvbox-light', 'nature', 'nature-light', 'amethyst-haze', 'amethyst-haze-light', 'win98', 'modus', 'modus-light'];
                  root.classList.remove(...allThemes);

                  if (theme === 'system') {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    root.classList.add(systemTheme);
                  } else {
                    // Handle compound theme names (e.g., 'nature-dark' -> 'nature' + 'dark')
                    if (theme === 'nature-dark') {
                      root.classList.add('nature', 'dark');
                    } else if (theme === 'nature-light') {
                      root.classList.add('nature-light');
                    } else if (theme === 'gruvbox-dark') {
                      root.classList.add('gruvbox', 'dark');
                    } else if (theme === 'gruvbox-light') {
                      root.classList.add('gruvbox-light');
                    } else if (theme === 'amethyst-haze-dark') {
                      root.classList.add('amethyst-haze', 'dark');
                    } else if (theme === 'amethyst-haze-light') {
                      root.classList.add('amethyst-haze-light');
                    } else if (theme === 'solarized-dark') {
                      root.classList.add('solarized-dark');
                    } else if (theme === 'modus-light') {
                      root.classList.add('modus-light');
                    } else if (theme === 'win98') {
                      root.classList.add('win98');
                    } else {
                      root.classList.add(theme);
                    }
                  }
                } catch (e) {
                  // Fallback to dark theme if localStorage is not available
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}