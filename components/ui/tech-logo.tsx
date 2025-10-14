import React from 'react';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getTechLogo, getTechDisplayName } from '@/lib/utils/tech-logo-mapper';

export type TechLogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface TechLogoProps {
  /** Technology identifier (e.g., 'salesforce', 'stripe', 'postgresql') */
  tech?: string;
  /** Path to image or SVG component */
  src?: string;
  /** Inline SVG component to render */
  component?: React.ComponentType<{ className?: string }>;
  /** Technology name for alt text and tooltip */
  name?: string;
  /** Size variant */
  size?: TechLogoSize;
  /** Additional CSS classes */
  className?: string;
  /** Show tooltip on hover */
  showTooltip?: boolean;
}

const sizeConfig: Record<TechLogoSize, { container: string; image: number; iconClass: string }> = {
  sm: { container: 'w-5 h-5', image: 16, iconClass: 'w-4 h-4' },
  md: { container: 'w-6 h-6', image: 20, iconClass: 'w-5 h-5' },
  lg: { container: 'w-8 h-8', image: 28, iconClass: 'w-7 h-7' },
  xl: { container: 'w-10 h-10', image: 36, iconClass: 'w-9 h-9' },
};

export function TechLogo({
  tech,
  src,
  component: Component,
  name,
  size = 'md',
  className = '',
  showTooltip = true,
}: TechLogoProps) {
  const config = sizeConfig[size];

  // If tech prop provided, resolve logo path and name
  let logoSrc = src;
  let displayName = name;

  if (tech) {
    const mapping = getTechLogo(tech);
    logoSrc = mapping.iconPath || src;
    displayName = name || getTechDisplayName(tech);
  }

  const logoContent = (
    <div
      className={`
        ${config.container}
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-700
        rounded
        p-1.5
        flex items-center justify-center
        ${className}
      `}
      role="img"
      aria-label={displayName}
    >
      {Component ? (
        <Component className={config.iconClass} />
      ) : logoSrc ? (
        <Image
          src={logoSrc}
          alt={displayName || 'Tech logo'}
          width={config.image}
          height={config.image}
          className="object-contain"
        />
      ) : null}
    </div>
  );

  if (!showTooltip || !displayName) {
    return logoContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{logoContent}</TooltipTrigger>
        <TooltipContent>
          <p>{displayName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Convenience wrapper for multiple tech logos in a row */
interface TechLogoGroupProps {
  logos: Array<{
    src?: string;
    component?: React.ComponentType<{ className?: string }>;
    name: string;
  }>;
  size?: TechLogoSize;
  className?: string;
}

export function TechLogoGroup({ logos, size = 'md', className = '' }: TechLogoGroupProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {logos.map((logo, idx) => (
        <TechLogo
          key={idx}
          src={logo.src}
          component={logo.component}
          name={logo.name}
          size={size}
        />
      ))}
    </div>
  );
}
