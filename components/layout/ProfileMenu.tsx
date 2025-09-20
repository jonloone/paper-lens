'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Settings,
  Key,
  Activity,
  BookOpen,
  HelpCircle,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
  Monitor,
  Bell,
  Keyboard,
  Globe,
  Shield,
  Users,
  CreditCard
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface ProfileMenuProps {
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
    initials?: string;
  };
}

export function ProfileMenu({ user }: ProfileMenuProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const userInitials = user?.initials || user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  const userName = user?.name || 'User';
  const userEmail = user?.email || 'user@example.com';

  const handleNavigation = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  const handleSignOut = () => {
    // TODO: Implement sign out logic
    console.log('Sign out');
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar} alt={userName} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-72" align="end">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar} alt={userName} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Profile Section */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>My Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleNavigation('/profile/activity')}>
            <Activity className="mr-2 h-4 w-4" />
            <span>My Activity</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Preferences Section */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">Preferences</DropdownMenuLabel>
          
          <DropdownMenuItem>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <Sun className="mr-2 h-4 w-4" />
                <span>Theme</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant={theme === 'light' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTheme('light');
                  }}
                >
                  <Sun className="h-3 w-3" />
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTheme('system');
                  }}
                >
                  <Monitor className="h-3 w-3" />
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTheme('dark');
                  }}
                >
                  <Moon className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleNavigation('/profile/preferences')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Editor Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleNavigation('/profile/notifications')}>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleNavigation('/profile/shortcuts')}>
            <Keyboard className="mr-2 h-4 w-4" />
            <span>Keyboard Shortcuts</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleNavigation('/profile/language')}>
            <Globe className="mr-2 h-4 w-4" />
            <span>Language & Region</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Access & Security Section */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">Access & Security</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={() => handleNavigation('/profile/api-keys')}>
            <Key className="mr-2 h-4 w-4" />
            <span>My API Keys</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleNavigation('/profile/security')}>
            <Shield className="mr-2 h-4 w-4" />
            <span>Security Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleNavigation('/profile/billing')}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Help Section */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleNavigation('/docs')}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Documentation</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleNavigation('/help')}>
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help & Support</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Teams & Sign Out */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleNavigation('/teams')}>
            <Users className="mr-2 h-4 w-4" />
            <span>Switch Team</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}