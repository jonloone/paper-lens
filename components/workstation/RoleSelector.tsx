'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RoleSelectorProps {
  value: 'data_engineer' | 'analytics_engineer' | 'data_analyst' | 'domain_expert' | 'executive';
  onChange: (role: 'data_engineer' | 'analytics_engineer' | 'data_analyst' | 'domain_expert' | 'executive') => void;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  const roleLabels = {
    data_engineer: 'Data Engineer',
    analytics_engineer: 'Analytics Engineer',
    data_analyst: 'Data Analyst',
    domain_expert: 'Domain Expert',
    executive: 'Executive'
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">Role:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-48 bg-gray-900 border-gray-700 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(roleLabels).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}