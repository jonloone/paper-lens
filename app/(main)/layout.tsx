"use client"

import React from 'react';
import { usePathname } from 'next/navigation';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { OmniLauncherEnhanced } from '@/components/ui/omni-launcher-enhanced';
import { Win98Taskbar } from '@/components/ui/win98-taskbar';
import { cn } from '@/lib/utils';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Determine current page for OmniLauncher context
  const getCurrentPage = () => {
    if (pathname === '/') return 'monitor';
    if (pathname.startsWith('/build')) return 'build';
    if (pathname.startsWith('/catalog')) return 'catalog';
    if (pathname.startsWith('/manage')) return 'manage';
    return 'overview';
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle Radial Lighting Effect */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--primary) / 0.08), transparent 70%)',
        }} />
      </div>

      {/* Noise Texture */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Top Navigation */}
      <TopNavigation />

      {/* OmniLauncher Enhanced - Left Side */}
      <OmniLauncherEnhanced position="left" currentPage={getCurrentPage()} />

      {/* Main Content Area - Account for top nav height */}
      <main className="pt-24 pb-8 px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Windows 98 Taskbar */}
      <Win98Taskbar />
    </div>
  );
}