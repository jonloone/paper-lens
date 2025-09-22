'use client';

import * as React from 'react';
import { Settings } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UnifiedIcon } from '@/components/ui/unified-icon';

const themes = [
  { value: 'light', label: 'Default' },
  { value: 'dracula', label: 'Dracula' },
  { value: 'solarized-light', label: 'Solarized' },
  { value: 'one-dark-pro', label: 'One Dark Pro' },
  { value: 'gruvbox', label: 'Gruvbox' },
  { value: 'nature', label: 'Nature' },
  { value: 'amethyst-haze', label: 'Amethyst Haze' },
  { value: 'win98', label: '98.css' },
  { value: 'modus', label: 'Modus' },
  { value: 'system', label: 'System' }
];

export function SettingsSheet() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const [isDark, setIsDark] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Check initial dark mode state
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  React.useEffect(() => {
    // Update dark mode state when document changes
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-14 w-14 flex flex-col items-center justify-center rounded-lg" disabled>
        <UnifiedIcon name="Settings" className="mb-1" size="md" theme={theme} />
      </Button>
    );
  }

  const toggleDarkMode = () => {
    const newIsDark = !isDark;
    if (newIsDark) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    setIsDark(newIsDark);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="h-14 w-14 flex flex-col items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:text-primary hover:bg-primary/10"
        >
          <UnifiedIcon
            name="Settings"
            className="mb-1"
            size="md"
            theme={theme}
          />
          <span className="text-[11px] font-medium leading-tight text-center font-reckless">
            Settings
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Customize your workspace appearance and preferences
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-6 pr-4">
            {/* Appearance Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Appearance</h3>
                <p className="text-sm text-muted-foreground">
                  Customize how the application looks
                </p>
              </div>
              <Separator />

              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode" className="text-base">
                    Dark Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark appearance
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <UnifiedIcon
                    name="Sun"
                    size="sm"
                    className={isDark ? "text-slate-400" : "text-amber-500"}
                  />
                  <Switch
                    id="dark-mode"
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
              </div>

              {/* Theme Selection */}
              <div className="space-y-3">
                <Label htmlFor="theme" className="text-base">
                  Theme
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select a color theme for the interface
                </p>
                <RadioGroup
                  id="theme"
                  value={theme}
                  onValueChange={setTheme}
                  className="grid grid-cols-2 gap-4"
                >
                  {themes.map((themeOption) => (
                    <div key={themeOption.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={themeOption.value} id={themeOption.value} />
                      <Label
                        htmlFor={themeOption.value}
                        className="font-normal cursor-pointer"
                      >
                        {themeOption.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            {/* Other Settings Sections Can Go Here */}
            <Separator />

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Preferences</h3>
                <p className="text-sm text-muted-foreground">
                  Additional workspace preferences
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                More settings coming soon...
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}