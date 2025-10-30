'use client';

import { cn } from '@/lib/utils';
import { PixelIcon, usePixelIcons } from './pixel-icon';
import * as PhosphorIcons from 'phosphor-react';

// Mapping of icon names to Phosphor React components
const phosphorIconMapping: Record<string, any> = {
  // Navigation icons
  'LayoutDashboard': PhosphorIcons.House,
  'Hammer': PhosphorIcons.Wrench, // Hammer doesn't exist, use Wrench
  'Compass': PhosphorIcons.Compass,
  'Shield': PhosphorIcons.Shield,
  'Cable': PhosphorIcons.Link,
  'Gauge': PhosphorIcons.Gauge,
  'Share2': PhosphorIcons.ShareNetwork,
  'Home': PhosphorIcons.House,

  // Dropdown icons
  'Activity': PhosphorIcons.Activity,
  'Settings': PhosphorIcons.Gear,
  'AlertTriangle': PhosphorIcons.Warning,
  'Wrench': PhosphorIcons.Wrench,
  'Database': PhosphorIcons.Database,
  'Layers': PhosphorIcons.Stack,
  'Play': PhosphorIcons.Play,
  'Package': PhosphorIcons.Package,
  'Key': PhosphorIcons.Key,
  'Users': PhosphorIcons.Users,

  // Theme icons
  'Sun': PhosphorIcons.Sun,
  'Moon': PhosphorIcons.Moon,
  'Palette': PhosphorIcons.Palette,
  'Monitor': PhosphorIcons.Monitor,
  'Code': PhosphorIcons.Code,
  'Coffee': PhosphorIcons.Coffee,
  'TreePine': PhosphorIcons.Tree,
  'Gem': PhosphorIcons.Diamond, // Gem doesn't exist, use Diamond
  'Computer': PhosphorIcons.Desktop,

  // File & Folder icons
  'File': PhosphorIcons.File,
  'FileText': PhosphorIcons.FileText,
  'FileUp': PhosphorIcons.FileArrowUp,
  'Folder': PhosphorIcons.Folder,
  'FolderOpen': PhosphorIcons.FolderOpen,
  'FileCode': PhosphorIcons.FileCode,
  'FilePlus': PhosphorIcons.FilePlus,
  'FileX': PhosphorIcons.FileX,
  'FileCheck': PhosphorIcons.CheckCircle, // FileCheck doesn't exist, use CheckCircle

  // Navigation & UI icons
  'ChevronDown': PhosphorIcons.CaretDown,
  'ChevronUp': PhosphorIcons.CaretUp,
  'ChevronLeft': PhosphorIcons.CaretLeft,
  'ChevronRight': PhosphorIcons.CaretRight,
  'ArrowLeft': PhosphorIcons.ArrowLeft,
  'ArrowRight': PhosphorIcons.ArrowRight,
  'ArrowUp': PhosphorIcons.ArrowUp,
  'ArrowDown': PhosphorIcons.ArrowDown,
  'Menu': PhosphorIcons.List,
  'X': PhosphorIcons.X,
  'Plus': PhosphorIcons.Plus,
  'Minus': PhosphorIcons.Minus,
  'MoreHorizontal': PhosphorIcons.DotsThree,
  'MoreVertical': PhosphorIcons.DotsThreeVertical,

  // Action icons
  'Search': PhosphorIcons.MagnifyingGlass,
  'Edit': PhosphorIcons.PencilSimple,
  'Edit2': PhosphorIcons.Pencil,
  'Edit3': PhosphorIcons.PencilLine,
  'Trash': PhosphorIcons.Trash,
  'Trash2': PhosphorIcons.TrashSimple,
  'Copy': PhosphorIcons.Copy,
  'Clipboard': PhosphorIcons.Clipboard,
  'Save': PhosphorIcons.FloppyDisk,
  'Download': PhosphorIcons.Download,
  'Upload': PhosphorIcons.Upload,
  'Share': PhosphorIcons.Share,
  'Send': PhosphorIcons.PaperPlaneTilt,
  'RefreshCw': PhosphorIcons.ArrowClockwise,
  'RotateCw': PhosphorIcons.ArrowClockwise,

  // Development icons
  'GitBranch': PhosphorIcons.GitBranch,
  'GitCommit': PhosphorIcons.GitCommit,
  'GitMerge': PhosphorIcons.GitMerge,
  'GitPullRequest': PhosphorIcons.GitPullRequest,
  'Terminal': PhosphorIcons.Terminal,
  'Code2': PhosphorIcons.Code, // CodeBlock doesn't exist, use Code
  'Bug': PhosphorIcons.Bug,
  'Cpu': PhosphorIcons.Cpu,
  'HardDrive': PhosphorIcons.HardDrive,

  // Data & Analytics icons
  'LineChart': PhosphorIcons.ChartLine,
  'BarChart': PhosphorIcons.ChartBar,
  'BarChart2': PhosphorIcons.ChartBarHorizontal,
  'BarChart3': PhosphorIcons.ChartBar,
  'PieChart': PhosphorIcons.ChartPie,
  'TrendingUp': PhosphorIcons.TrendUp,
  'TrendingDown': PhosphorIcons.TrendDown,
  'Zap': PhosphorIcons.Lightning,
  'Server': PhosphorIcons.Database, // Server doesn't exist, use Database
  'Cloud': PhosphorIcons.Cloud,
  'Globe': PhosphorIcons.Globe,
  'ShoppingCart': PhosphorIcons.ShoppingCart,

  // Status & Feedback icons
  'Info': PhosphorIcons.Info,
  'CheckCircle': PhosphorIcons.CheckCircle,
  'XCircle': PhosphorIcons.XCircle,
  'AlertCircle': PhosphorIcons.WarningCircle,
  'Check': PhosphorIcons.Check,
  'Clock': PhosphorIcons.Clock,
  'Bell': PhosphorIcons.Bell,
  'BellOff': PhosphorIcons.BellSlash,
  'Eye': PhosphorIcons.Eye,
  'EyeOff': PhosphorIcons.EyeSlash,
  'Lock': PhosphorIcons.Lock,
  'Unlock': PhosphorIcons.LockOpen,
  'Star': PhosphorIcons.Star,
  'Heart': PhosphorIcons.Heart,
  'MessageSquare': PhosphorIcons.Chat, // ChatSquare doesn't exist, use Chat
  'Mail': PhosphorIcons.Envelope,

  // Media icons
  'Image': PhosphorIcons.Image,
  'Video': PhosphorIcons.VideoCamera,
  'Music': PhosphorIcons.MusicNote,
  'Mic': PhosphorIcons.Microphone,
  'Volume': PhosphorIcons.SpeakerHigh, // Speaker doesn't exist, use SpeakerHigh
  'Volume2': PhosphorIcons.SpeakerHigh,
  'VolumeX': PhosphorIcons.SpeakerX,
  'Camera': PhosphorIcons.Camera,

  // Layout icons
  'Grid': PhosphorIcons.GridFour,
  'List': PhosphorIcons.List,
  'Layout': PhosphorIcons.Layout,
  'Sidebar': PhosphorIcons.Sidebar,
  'Square': PhosphorIcons.Square,
  'Circle': PhosphorIcons.Circle,
  'Triangle': PhosphorIcons.Triangle,
  'DollarSign': PhosphorIcons.CurrencyDollar,
};

interface UnifiedIconProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: string;
}

const sizeClasses = {
  sm: 'text-base',    // 16px
  md: 'text-lg',      // 18px
  lg: 'text-xl',      // 20px
  xl: 'text-2xl',     // 24px
};

const phosphorSizes = {
  sm: 16,
  md: 18,
  lg: 20,
  xl: 24,
};

export function UnifiedIcon({ name, className, size = 'md', theme }: UnifiedIconProps) {
  // Handle undefined or null name
  if (!name) {
    return null;
  }

  const shouldUsePixelIcons = usePixelIcons(theme);

  if (shouldUsePixelIcons) {
    // Use pixel icons for IDE themes
    return <PixelIcon name={name} className={className} size={size} />;
  }

  // Use Phosphor icons for standard themes
  const PhosphorComponent = phosphorIconMapping[name];

  if (PhosphorComponent) {
    return (
      <PhosphorComponent
        size={phosphorSizes[size]}
        className={cn(className)}
        weight="regular"
      />
    );
  }

  // Fallback to pixel icon if Phosphor mapping doesn't exist
  return <PixelIcon name={name} className={className} size={size} />;
}

// Helper function to check if we should use pixel icons (re-export for convenience)
export { usePixelIcons } from './pixel-icon';