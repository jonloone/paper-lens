'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { paperManager, PaperWorkspace } from '@/lib/paperwm/PaperManager';
import { cn } from '@/lib/utils';

// Import all paper components
import {
  HomePaper,
  ErrorAnalysisPaper,
  SchemaInvestigationPaper,
  FixPlanningPaper,
  DeploymentMonitoringPaper,
  ProductDefinitionPaper,
  SourceConfigurationPaper,
  ModelDevelopmentPaper,
  QualitySetupPaper,
  DeploymentPipelinePaper
} from '@/components/papers';

// Paper component registry
const PAPER_COMPONENTS = {
  'home': HomePaper,
  'error-analysis': ErrorAnalysisPaper,
  'schema-investigation': SchemaInvestigationPaper,
  'fix-planning': FixPlanningPaper,
  'deployment-monitoring': DeploymentMonitoringPaper,
  'product-definition': ProductDefinitionPaper,
  'source-configuration': SourceConfigurationPaper,
  'model-development': ModelDevelopmentPaper,
  'quality-setup': QualitySetupPaper,
  'deployment-pipeline': DeploymentPipelinePaper
};

interface EnhancedPaperWMProps {
  className?: string;
}

export function EnhancedPaperWM({ className }: EnhancedPaperWMProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [workspace, setWorkspace] = useState<PaperWorkspace>(paperManager.getWorkspace());
  const [viewportWidth, setViewportWidth] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Smooth scrolling animation
  const { scrollX } = useScroll({ container: scrollRef });
  const scrollProgress = useTransform(scrollX, [0, 1000], [0, 1]);
  
  // Subscribe to workspace changes
  useEffect(() => {
    const unsubscribe = paperManager.subscribe(setWorkspace);
    
    // Load saved workspace
    paperManager.loadWorkspace();
    
    // Set initial viewport width
    setViewportWidth(window.innerWidth);
    
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    return () => {
      unsubscribe();
      window.removeEventListener('resize', handleResize);
      paperManager.saveWorkspace();
    };
  }, []);
  
  // Handle smooth scrolling to active paper
  useEffect(() => {
    if (scrollRef.current && workspace.activePaperId) {
      const activePaper = workspace.papers.find(p => p.id === workspace.activePaperId);
      if (activePaper) {
        // Center the active paper in viewport with 80% width visible
        const paperWidth = viewportWidth * activePaper.width;
        const targetScroll = activePaper.position - (viewportWidth - paperWidth) / 2;
        scrollRef.current.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
      }
    }
  }, [workspace.activePaperId, workspace.papers, viewportWidth]);
  
  /**
   * Handle scroll wheel to switch between papers
   */
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Prevent default scrolling
      e.preventDefault();
      
      // Ignore if already scrolling
      if (isScrolling) return;
      
      const currentIndex = workspace.papers.findIndex(p => p.id === workspace.activePaperId);
      
      if (e.deltaY > 0 && currentIndex < workspace.papers.length - 1) {
        // Scroll right to next paper
        setIsScrolling(true);
        const nextPaper = workspace.papers[currentIndex + 1];
        paperManager.navigateToPaper(nextPaper.id, { animate: true });
        
        // Reset scrolling flag after animation
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 500);
      } else if (e.deltaY < 0 && currentIndex > 0) {
        // Scroll left to previous paper
        setIsScrolling(true);
        const prevPaper = workspace.papers[currentIndex - 1];
        paperManager.navigateToPaper(prevPaper.id, { animate: true });
        
        // Reset scrolling flag after animation
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 500);
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [workspace.papers, workspace.activePaperId, isScrolling]);
  
  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = workspace.papers.findIndex(p => p.id === workspace.activePaperId);
      
      // Alt + Arrow Keys for navigation
      if (e.altKey) {
        if (e.key === 'ArrowRight' && currentIndex < workspace.papers.length - 1) {
          e.preventDefault();
          const nextPaper = workspace.papers[currentIndex + 1];
          paperManager.navigateToPaper(nextPaper.id, { animate: true });
        } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
          e.preventDefault();
          const prevPaper = workspace.papers[currentIndex - 1];
          paperManager.navigateToPaper(prevPaper.id, { animate: true });
        } else if (e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          if (workspace.activePaperId && workspace.activePaperId !== 'home') {
            paperManager.closePaper(workspace.activePaperId);
          }
        } else if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          paperManager.navigateToPaper('home', { animate: true });
        }
      }
      
      // Number keys for quick navigation (1-9)
      if (!e.altKey && !e.ctrlKey && !e.metaKey && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index < workspace.papers.length) {
          paperManager.navigateToPaper(workspace.papers[index].id, { animate: true });
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [workspace.papers, workspace.activePaperId]);
  
  /**
   * Handle paper spawning from actions
   */
  const handleSpawnPaper = useCallback((config: {
    type: any;
    title: string;
    componentKey: string;
    parentId?: string;
    initialState?: any;
    workflowId?: string;
  }) => {
    const Component = PAPER_COMPONENTS[config.componentKey as keyof typeof PAPER_COMPONENTS];
    if (!Component) {
      console.error(`Unknown paper component: ${config.componentKey}`);
      return;
    }
    
    paperManager.spawnPaper({
      type: config.type,
      title: config.title,
      component: Component,
      parentId: config.parentId,
      initialState: config.initialState,
      workflowId: config.workflowId
    });
  }, []);
  
  /**
   * Handle paper closing
   */
  const handleClosePaper = useCallback((paperId: string) => {
    paperManager.closePaper(paperId);
  }, []);
  
  /**
   * Handle paper navigation
   */
  const handleNavigateToPaper = useCallback((paperId: string) => {
    paperManager.navigateToPaper(paperId, { animate: true });
  }, []);
  
  /**
   * Handle workflow state updates
   */
  const handleUpdateWorkflowState = useCallback((workflowId: string, state: any) => {
    paperManager.updateWorkflowState(workflowId, state);
  }, []);
  
  /**
   * Render individual paper
   */
  const renderPaper = (paper: any) => {
    const isActive = paper.id === workspace.activePaperId;
    const adjacentPapers = paperManager.getAdjacentPapers(paper.id);
    
    // Get the component
    let Component = paper.component;
    if (!Component && paper.id === 'home') {
      Component = HomePaper;
    }
    
    if (!Component) {
      console.error(`No component for paper ${paper.id}`);
      return null;
    }
    
    const paperWidth = viewportWidth * paper.width;
    const isInViewport = Math.abs(paper.position - workspace.scrollPosition) < viewportWidth * 1.5;
    
    return (
      <motion.div
        key={paper.id}
        className={cn(
          'absolute top-0 h-full',
          'bg-gray-950 rounded-lg overflow-hidden',
          'transition-all duration-300',
          isActive ? 'ring-2 ring-blue-500/50 shadow-2xl z-10' : 'ring-1 ring-gray-800',
          !isInViewport && 'pointer-events-none opacity-0'
        )}
        style={{
          left: paper.position,
          width: paperWidth
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: isActive ? 1 : 0.85,
          scale: isActive ? 1 : 0.98
        }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        onClick={() => !isActive && handleNavigateToPaper(paper.id)}
      >
        {/* Paper Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900/50 backdrop-blur border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {paper.type.toUpperCase()}
            </span>
            <span className="text-sm text-white font-medium">
              {paper.title}
            </span>
          </div>
          
          {paper.id !== 'home' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClosePaper(paper.id);
              }}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Paper Content */}
        <div className="h-[calc(100%-40px)] overflow-y-auto">
          <Component
            paperId={paper.id}
            state={paper.state}
            workflowState={paper.context?.workflowId 
              ? workspace.workflowStates.get(paper.context.workflowId)
              : null
            }
            adjacentPapers={adjacentPapers}
            onSpawnPaper={handleSpawnPaper}
            onUpdateState={(updates: any) => paperManager.updatePaperState(paper.id, updates)}
            onUpdateWorkflowState={paper.context?.workflowId 
              ? (state: any) => handleUpdateWorkflowState(paper.context!.workflowId!, state)
              : undefined
            }
            onNavigate={handleNavigateToPaper}
          />
        </div>
        
        {/* Adjacent Paper Indicators */}
        {adjacentPapers.left && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full px-2 py-1 bg-gray-900/80 rounded-l text-xs text-gray-400">
            ← {adjacentPapers.left.title}
          </div>
        )}
        {adjacentPapers.right && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full px-2 py-1 bg-gray-900/80 rounded-r text-xs text-gray-400">
            {adjacentPapers.right.title} →
          </div>
        )}
      </motion.div>
    );
  };
  
  // Calculate total canvas width
  const totalCanvasWidth = workspace.papers.reduce((width, paper) => {
    return Math.max(width, paper.position + viewportWidth * paper.width);
  }, viewportWidth);
  
  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed inset-0 bg-gray-950 overflow-hidden',
        className
      )}
    >
      {/* Scrollable Canvas - Hidden scrollbar, controlled programmatically */}
      <div
        ref={scrollRef}
        className="h-full overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{
          scrollBehavior: 'smooth'
        }}
      >
        <div
          className="relative h-full"
          style={{ width: totalCanvasWidth + 200 }}
        >
          <AnimatePresence mode="popLayout">
            {workspace.papers.map(renderPaper)}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Navigation Indicators - Fixed above everything */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 px-4 py-2 rounded-full border border-gray-800 shadow-2xl">
        {workspace.papers.map((paper, index) => (
          <div key={paper.id} className="relative group">
            <button
              onClick={() => handleNavigateToPaper(paper.id)}
              className={cn(
                'rounded-full transition-all',
                paper.id === workspace.activePaperId
                  ? 'bg-blue-500 w-8 h-2'
                  : 'bg-gray-600 hover:bg-gray-500 w-2 h-2'
              )}
              title={`${index + 1}. ${paper.title}`}
            />
            {/* Show paper number on hover */}
            <div className={cn(
              "absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity",
              paper.id === workspace.activePaperId && "opacity-100 text-blue-400"
            )}>
              {index + 1}
            </div>
          </div>
        ))}
      </div>
      
      {/* Keyboard Shortcuts Hint - Fixed position with higher z-index */}
      <div className="fixed top-4 right-4 text-xs text-gray-500 z-40 bg-gray-900/80 px-3 py-2 rounded-lg backdrop-blur">
        <div>Scroll/Alt + ← / → : Navigate Papers</div>
        <div>1-9 : Quick Jump to Paper</div>
        <div>Alt + W : Close Paper</div>
        <div>Alt + H : Return Home</div>
      </div>
      
      {/* AI Assistant Indicator - Fixed position */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button className="p-3 bg-gray-900 rounded-full border border-gray-800 hover:border-blue-500/50 transition-colors shadow-xl">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
            />
          </svg>
        </button>
      </motion.div>
    </div>
  );
}

// Add scrollbar hide styles
const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = scrollbarHideStyles;
  document.head.appendChild(style);
}