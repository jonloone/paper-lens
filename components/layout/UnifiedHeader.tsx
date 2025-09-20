'use client';

import React, { useState } from 'react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

export function UnifiedHeader() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="h-16 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-6">
        {/* Logo with Reckless font */}
        <h1 className="text-2xl font-medium" style={{ fontFamily: 'Reckless, serif' }}>
          NexusOne
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Profile Dropdown */}
        <DropdownMenu open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-800/50 transition-colors focus:outline-none">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">DE</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800 text-white">
            <div className="px-3 py-2 border-b border-gray-800">
              <p className="text-sm font-medium">Data Engineer</p>
              <p className="text-xs text-gray-400">engineer@nexusone.ai</p>
            </div>
            
            <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer">
              <i className="fas fa-cog w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            
            <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer">
              <i className="fas fa-keyboard w-4 mr-2" />
              Keyboard Shortcuts
            </DropdownMenuItem>
            
            <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer">
              <i className="fas fa-question-circle w-4 mr-2" />
              Help & Documentation
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-gray-800" />
            
            <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer text-red-400">
              <i className="fas fa-sign-out-alt w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}