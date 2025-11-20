"use client"

import React from 'react';
import { usePathname } from 'next/navigation';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { RightDock } from '@/components/layout/RightDock';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide nav and dock when in build workspace or explore pages
  const hideNavAndDock = pathname === '/build' || pathname?.startsWith('/build/') || pathname?.startsWith('/explore') || pathname?.startsWith('/analyze/explore');

  return (
    <div className="min-h-screen relative">
      {/* Single Unified Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Base Noise Texture - Dark Mode */}
        <div
          className="absolute inset-0 opacity-[0.035] dark:block hidden"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:svgjs='http://svgjs.dev/svgjs' viewBox='0 0 700 700' width='700' height='700'%3E%3Cdefs%3E%3Cfilter id='nnnoise-filter' x='-20%25' y='-20%25' width='140%25' height='140%25' filterUnits='objectBoundingBox' primitiveUnits='userSpaceOnUse' color-interpolation-filters='linearRGB'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.102' numOctaves='4' seed='15' stitchTiles='stitch' x='0%25' y='0%25' width='100%25' height='100%25' result='turbulence'%3E%3C/feTurbulence%3E%3CfeSpecularLighting surfaceScale='15' specularConstant='0.75' specularExponent='20' lighting-color='%237957A8' x='0%25' y='0%25' width='100%25' height='100%25' in='turbulence' result='specularLighting'%3E%3CfeDistantLight azimuth='3' elevation='100'%3E%3C/feDistantLight%3E%3C/feSpecularLighting%3E%3C/filter%3E%3C/defs%3E%3Crect width='700' height='700' fill='transparent'%3E%3C/rect%3E%3Crect width='700' height='700' fill='%237957a8' filter='url(%23nnnoise-filter)'%3E%3C/rect%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Base Noise Texture - Light Mode */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:hidden block"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:svgjs='http://svgjs.dev/svgjs' viewBox='0 0 700 700' width='700' height='700'%3E%3Cdefs%3E%3Cfilter id='nnnoise-filter-light' x='-20%25' y='-20%25' width='140%25' height='140%25' filterUnits='objectBoundingBox' primitiveUnits='userSpaceOnUse' color-interpolation-filters='linearRGB'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.102' numOctaves='4' seed='15' stitchTiles='stitch' x='0%25' y='0%25' width='100%25' height='100%25' result='turbulence'%3E%3C/feTurbulence%3E%3CfeSpecularLighting surfaceScale='15' specularConstant='0.75' specularExponent='20' lighting-color='%235a3d7a' x='0%25' y='0%25' width='100%25' height='100%25' in='turbulence' result='specularLighting'%3E%3CfeDistantLight azimuth='3' elevation='100'%3E%3C/feDistantLight%3E%3C/feSpecularLighting%3E%3C/filter%3E%3C/defs%3E%3Crect width='700' height='700' fill='transparent'%3E%3C/rect%3E%3Crect width='700' height='700' fill='%235a3d7a' filter='url(%23nnnoise-filter-light)'%3E%3C/rect%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Subtle Radial Lighting Effect on top of noise */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, hsl(var(--primary) / 0.08), transparent 100%)',
        }} />
      </div>

      {/* Top Navigation - Hidden on /build workspace */}
      {!hideNavAndDock && <TopNavigation />}

      {/* Main Content Area */}
      <main className="relative z-10">
        {children}
      </main>

      {/* RightDock - Hidden on /build workspace */}
      {!hideNavAndDock && <RightDock />}
    </div>
  );
}