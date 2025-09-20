'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Play,
  Save,
  LayoutGrid,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Share2,
  RotateCcw,
  Settings
} from 'lucide-react';

interface FloatingActionBarProps {
  onRun: () => void;
  onSave: () => void;
  onLayout: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onReset: () => void;
  onShare: () => void;
  onSettings: () => void;
  isRunning?: boolean;
  isSaving?: boolean;
}

export function FloatingActionBar({
  onRun,
  onSave,
  onLayout,
  onZoomIn,
  onZoomOut,
  onFitView,
  onReset,
  onShare,
  onSettings,
  isRunning = false,
  isSaving = false
}: FloatingActionBarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  return (
    <motion.div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isVisible ? (isHovered ? 1 : 0.8) : 0.4, 
        y: 0,
        scale: isHovered ? 1.02 : 1
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="px-4 py-2 shadow-lg border backdrop-blur-sm bg-background/95">
        <div className="flex items-center gap-1">
          {/* Primary Actions */}
          <Button 
            size="sm" 
            variant="default"
            onClick={onRun}
            disabled={isRunning}
            className="gap-1.5"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={onSave}
            disabled={isSaving}
            className="gap-1.5"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Layout Controls */}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onLayout}
            title="Auto Layout (Ctrl+L)"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onFitView}
            title="Fit View (Ctrl+0)"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Zoom Controls */}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onZoomIn}
            title="Zoom In (Ctrl++)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onZoomOut}
            title="Zoom Out (Ctrl+-)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Secondary Actions */}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onShare}
            title="Share Pattern"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onReset}
            title="Reset Pattern"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onSettings}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}