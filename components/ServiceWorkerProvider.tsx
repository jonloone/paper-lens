'use client';

import { useEffect, useState } from 'react';
import { swManager } from '@/lib/utils/serviceWorker';

export default function ServiceWorkerProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [swStatus, setSwStatus] = useState<'idle' | 'registering' | 'ready' | 'error'>('idle');
  const [cacheStatus, setCacheStatus] = useState<{ size: number; count: number } | null>(null);
  
  useEffect(() => {
    const registerSW = async () => {
      setSwStatus('registering');
      
      try {
        const registration = await swManager.register();
        
        if (registration) {
          setSwStatus('ready');
          
          // Wait for service worker to be ready before prefetching
          const isReady = await swManager.isReady();
          
          if (isReady) {
            // Start prefetching PMTiles in the background
            console.log('Starting PMTiles prefetch...');
            swManager.prefetchPMTiles().catch(err => {
              console.warn('PMTiles prefetch failed:', err);
            });
            
            // Get initial cache stats
            const stats = await swManager.getCacheStats();
            setCacheStatus(stats);
          }
        } else {
          setSwStatus('error');
        }
      } catch (error) {
        console.error('Service worker registration error:', error);
        setSwStatus('error');
      }
    };
    
    // Only register in production or if explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_SW === 'true') {
      registerSW();
    } else {
      console.log('Service worker disabled in development');
    }
    
    // Cleanup on unmount
    return () => {
      // Service worker persists, no cleanup needed
    };
  }, []);
  
  // Update cache stats periodically
  useEffect(() => {
    if (swStatus !== 'ready') return;
    
    const interval = setInterval(async () => {
      const stats = await swManager.getCacheStats();
      setCacheStatus(stats);
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [swStatus]);
  
  return (
    <>
      {children}
    </>
  );
}