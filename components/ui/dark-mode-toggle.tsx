'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { UnifiedIcon } from '@/components/ui/unified-icon';

export function DarkModeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 opacity-50">
        <UnifiedIcon name="Sun" size="sm" className="text-slate-400" />
        <Switch disabled checked />
        <UnifiedIcon name="Moon" size="sm" className="text-indigo-400" />
      </div>
    );
  }

  // Check if current theme ends with "-dark" or is "dark"
  const isDark = theme === 'dark' || theme?.endsWith('-dark') ||
                 ['dracula', 'one-dark-pro', 'gruvbox-dark', 'nature-dark', 'amethyst-haze-dark', 'modus'].includes(theme || '');

  const toggleDarkMode = () => {
    // If currently dark, switch to light variant
    if (isDark) {
      // Convert dark themes to light equivalents
      if (theme === 'dark') {
        setTheme('light');
      } else if (theme === 'gruvbox-dark') {
        setTheme('gruvbox-light');
      } else if (theme === 'nature-dark') {
        setTheme('nature-light');
      } else if (theme === 'amethyst-haze-dark') {
        setTheme('amethyst-haze-light');
      } else if (theme === 'modus') {
        setTheme('modus-light');
      } else if (theme === 'solarized-dark') {
        setTheme('solarized-light');
      } else {
        // For themes without light variant (dracula, one-dark-pro), switch to default light
        setTheme('light');
      }
    } else {
      // Convert light themes to dark equivalents
      if (theme === 'light') {
        setTheme('dark');
      } else if (theme === 'gruvbox-light') {
        setTheme('gruvbox-dark');
      } else if (theme === 'nature-light') {
        setTheme('nature-dark');
      } else if (theme === 'amethyst-haze-light') {
        setTheme('amethyst-haze-dark');
      } else if (theme === 'modus-light') {
        setTheme('modus');
      } else if (theme === 'solarized-light') {
        setTheme('solarized-dark');
      } else {
        // For themes without dark variant, switch to default dark
        setTheme('dark');
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <UnifiedIcon
        name="Sun"
        size="sm"
        className={isDark ? "text-slate-400" : "text-amber-500"}
      />
      <Switch
        checked={isDark}
        onCheckedChange={toggleDarkMode}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      />
      <UnifiedIcon
        name="Moon"
        size="sm"
        className={isDark ? "text-indigo-400" : "text-slate-400"}
      />
    </div>
  );
}