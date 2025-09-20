import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsProps {
  onTogglePanel?: () => void;
  onEditSelected?: () => void;
  onRunPipeline?: () => void;
  onShowLogs?: () => void;
  onShowMetrics?: () => void;
  onSearch?: () => void;
  onRefresh?: () => void;
}

export const useKeyboardShortcuts = ({
  onTogglePanel,
  onEditSelected,
  onRunPipeline,
  onShowLogs,
  onShowMetrics,
  onSearch,
  onRefresh
}: KeyboardShortcutsProps) => {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    
    switch (event.key) {
      case ' ':
        event.preventDefault();
        onTogglePanel?.();
        break;
      
      case 'e':
      case 'E':
        if (!isCtrlOrCmd) {
          event.preventDefault();
          onEditSelected?.();
        }
        break;
      
      case 'r':
      case 'R':
        if (isCtrlOrCmd) {
          event.preventDefault();
          onRunPipeline?.();
        } else if (!isCtrlOrCmd) {
          event.preventDefault();
          onRefresh?.();
        }
        break;
      
      case 'l':
      case 'L':
        if (isCtrlOrCmd) {
          event.preventDefault();
          onShowLogs?.();
        }
        break;
      
      case 'm':
      case 'M':
        if (!isCtrlOrCmd) {
          event.preventDefault();
          onShowMetrics?.();
        }
        break;
      
      case '/':
        event.preventDefault();
        onSearch?.();
        break;
      
      case 'F5':
        event.preventDefault();
        onRefresh?.();
        break;
    }
  }, [
    onTogglePanel,
    onEditSelected,
    onRunPipeline,
    onShowLogs,
    onShowMetrics,
    onSearch,
    onRefresh
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  return {
    shortcuts: {
      'Space': 'Toggle panel',
      'E': 'Edit selected',
      'Cmd+R': 'Run pipeline',
      'R': 'Refresh',
      'Cmd+L': 'Show logs',
      'M': 'Show metrics',
      '/': 'Search nodes'
    }
  };
};