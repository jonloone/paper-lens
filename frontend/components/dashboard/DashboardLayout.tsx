'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Home, Database, Code, Shield, Rocket, Activity, Settings,
  Search, Bell, User, ChevronDown, Menu, X, Command
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const topNavItems = [
    { id: 'projects', label: 'Projects', icon: Home, href: '/dashboard' },
    { id: 'sources', label: 'Sources', icon: Database, href: '/sources' },
    { id: 'models', label: 'Models', icon: Code, href: '/models' },
    { id: 'quality', label: 'Quality', icon: Shield, href: '/quality' },
    { id: 'deploy', label: 'Deploy', icon: Rocket, href: '/deploy' },
    { id: 'monitor', label: 'Monitor', icon: Activity, href: '/monitor' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' }
  ];
  
  const sidebarItems = {
    activeProjects: [
      { id: '1', name: 'Customer 360 View', status: 'in_progress', progress: 73 },
      { id: '2', name: 'Sales Analytics', status: 'review', progress: 90 },
      { id: '3', name: 'Inventory Optimization', status: 'development', progress: 45 }
    ],
    recentActivities: [
      { id: '1', type: 'model', name: 'customer_master', time: '2 hours ago' },
      { id: '2', type: 'source', name: 'PostgreSQL Production', time: '4 hours ago' },
      { id: '3', type: 'deployment', name: 'Risk Model v2.1', time: 'Yesterday' }
    ],
    favorites: [
      { id: '1', type: 'project', name: 'Customer 360 View' },
      { id: '2', type: 'model', name: 'revenue_forecast' },
      { id: '3', type: 'source', name: 'Data Warehouse' }
    ]
  };
  
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N1</span>
              </div>
              <span className="text-white font-semibold">NexusOne</span>
            </div>
            
            {/* Main Navigation */}
            <nav className="hidden md:flex items-center gap-1 ml-8">
              {topNavItems.map(item => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Command Palette Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-400 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden md:inline px-2 py-0.5 bg-gray-900 rounded text-xs">⌘K</kbd>
            </button>
            
            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {/* User Menu */}
            <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-800 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Layout */}
      <div className="flex pt-14">
        {/* Left Sidebar */}
        <aside className={cn(
          "fixed left-0 top-14 bottom-0 w-64 bg-gray-900 border-r border-gray-800 overflow-y-auto transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-4 space-y-6">
            {/* Active Projects */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Active Projects</h3>
              <div className="space-y-2">
                {sidebarItems.activeProjects.map(project => (
                  <a
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white">{project.name}</span>
                      <span className="text-xs text-gray-500">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </a>
                ))}
              </div>
            </div>
            
            {/* Recent Activities */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Recent Activities</h3>
              <div className="space-y-1">
                {sidebarItems.recentActivities.map(activity => (
                  <a
                    key={activity.id}
                    href="#"
                    className="block p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <div className="text-sm text-white">{activity.name}</div>
                    <div className="text-xs text-gray-500">{activity.type} • {activity.time}</div>
                  </a>
                ))}
              </div>
            </div>
            
            {/* Favorites */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Favorites</h3>
              <div className="space-y-1">
                {sidebarItems.favorites.map(favorite => (
                  <a
                    key={favorite.id}
                    href="#"
                    className="block p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <div className="text-sm text-white">{favorite.name}</div>
                    <div className="text-xs text-gray-500">{favorite.type}</div>
                  </a>
                ))}
              </div>
            </div>
            
            {/* AI Assistant */}
            <div className="border-t border-gray-800 pt-4">
              <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2">
                <Command className="w-4 h-4" />
                AI Assistant
              </button>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className={cn(
          "flex-1 transition-all duration-300",
          sidebarOpen ? "ml-64" : "ml-0"
        )}>
          {children}
        </main>
      </div>
      
      {/* Command Palette Modal (placeholder) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-gray-900 rounded-xl shadow-2xl">
            <div className="p-4 border-b border-gray-800">
              <input
                type="text"
                placeholder="Search projects, models, sources..."
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="p-4">
              <p className="text-gray-500 text-sm">Start typing to search...</p>
            </div>
            <div className="p-4 border-t border-gray-800">
              <button
                onClick={() => setSearchOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-300"
              >
                Press ESC to close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}