"use client"

import { AppSidebar } from '@/components/layout/AppSidebar';
import { SecondaryNav } from '@/components/layout/SecondaryNav';
import { AIAssistant } from '@/components/ai/AIAssistant';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-background transition-colors duration-200">
      <AppSidebar />
      <SecondaryNav />
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
      <AIAssistant />
    </div>
  );
}