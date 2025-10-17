'use client';

import { Step3ConversationalSQL } from '@/components/build/steps/Step3ConversationalSQL';

/**
 * Test page for SQL Workstation E2E tests
 * This page renders the Step3ConversationalSQL component in isolation
 * for testing purposes without requiring navigation through the wizard.
 */
export default function TestSQLWorkstationPage() {
  // Mock data for testing
  const mockSelectedSources = [
    {
      id: 'customers',
      name: 'customers',
      catalog: 'iceberg',
      schema: 'production',
      type: 'table' as const,
      columns: [
        { name: 'customer_id', type: 'INTEGER' },
        { name: 'name', type: 'VARCHAR' },
        { name: 'email', type: 'VARCHAR' },
        { name: 'risk_score', type: 'VARCHAR' },
      ]
    },
    {
      id: 'orders',
      name: 'orders',
      catalog: 'iceberg',
      schema: 'production',
      type: 'table' as const,
      columns: [
        { name: 'order_id', type: 'INTEGER' },
        { name: 'customer_id', type: 'INTEGER' },
        { name: 'order_date', type: 'TIMESTAMP' },
        { name: 'amount', type: 'DECIMAL' },
      ]
    }
  ];

  const mockProductDefinition = {
    name: 'Test Data Product',
    description: 'Test product for E2E testing',
    owner: 'test@example.com',
    domain: 'analytics',
  };

  return (
    <Step3ConversationalSQL
      selectedSources={mockSelectedSources}
      productDefinition={mockProductDefinition}
      onComplete={(data) => {
        console.log('SQL Workstation completed:', data);
      }}
      onBack={() => {
        console.log('Back button clicked');
      }}
    />
  );
}
