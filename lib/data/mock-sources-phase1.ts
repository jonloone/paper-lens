// Phase 1: Enhanced mock data with quality breakdown and sample data

import { Source } from '@/components/build/steps/Step2SelectSources';
import { QualityBreakdown, SampleDataPreview } from '@/lib/types/source-quality';

export const mockSourcesPhase1: Source[] = [
  {
    id: 'urn:li:dataset:(urn:li:dataPlatform:iceberg,analytics.customer_360,PROD)',
    name: 'customer_360',
    schema: 'analytics',
    database: 'iceberg_prod',
    qualityScore: 98,
    rowCount: 2500000,
    lastUpdated: '2 hours ago',
    description: 'Unified customer profile with demographics and behavior',
    columns: [
      { name: 'customer_id', type: 'string', description: 'Unique customer identifier', isPrimaryKey: true },
      { name: 'email', type: 'string', description: 'Customer email address' },
      { name: 'signup_date', type: 'date', description: 'Account creation date' },
      { name: 'total_revenue', type: 'decimal', description: 'Lifetime revenue' },
      { name: 'last_activity', type: 'timestamp', description: 'Last product interaction' },
      { name: 'country', type: 'string', description: 'Customer country' },
      { name: 'state', type: 'string', description: 'Customer state/region' },
      { name: 'city', type: 'string', description: 'Customer city' },
      { name: 'zipcode', type: 'string', description: 'Postal code' },
      { name: 'account_status', type: 'string', description: 'Active, suspended, or closed' }
    ],
    quality: {
      overallScore: 98,
      completeness: {
        score: 98,
        status: 'high',
        issues: [
          {
            column: 'email',
            type: 'null',
            count: 50000,
            percentage: 2,
            severity: 'low',
            description: '2% null values'
          }
        ]
      },
      uniqueness: {
        score: 100,
        status: 'high'
      },
      freshness: {
        score: 95,
        status: 'high',
        lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        expectedFrequency: 'hourly',
        isStale: false,
        updateHistory: [95, 98, 97, 99, 96, 98, 95] // Last 7 updates
      },
      validity: {
        score: 99,
        status: 'high'
      }
    },
    sampleData: {
      rows: [
        { customer_id: 'C001', email: 'john@example.com', signup_date: '2024-01-15', total_revenue: 1250.50, last_activity: '2025-01-05T10:30:00Z', country: 'USA', state: 'CA', city: 'San Francisco', zipcode: '94102', account_status: 'active' },
        { customer_id: 'C002', email: null, signup_date: '2024-02-20', total_revenue: 890.25, last_activity: '2025-01-04T15:22:00Z', country: 'USA', state: 'NY', city: 'New York', zipcode: '10001', account_status: 'active' },
        { customer_id: 'C003', email: 'sarah@example.com', signup_date: '2024-03-10', total_revenue: 2100.75, last_activity: '2025-01-06T09:15:00Z', country: 'UK', state: null, city: 'London', zipcode: 'SW1A', account_status: 'ACTIVE' },
        { customer_id: 'C004', email: 'mike@example.com', signup_date: '2024-04-05', total_revenue: 450.00, last_activity: '2024-12-30T14:45:00Z', country: 'Canada', state: 'ON', city: 'Toronto', zipcode: 'M5H', account_status: 'Active' },
        { customer_id: 'C005', email: 'lisa@example.com', signup_date: '2024-05-12', total_revenue: 3200.50, last_activity: '2025-01-05T11:20:00Z', country: 'USA', state: 'TX', city: 'Austin', zipcode: '78701', account_status: 'active' },
        { customer_id: 'C006', email: '', signup_date: '2024-06-18', total_revenue: 0, last_activity: '2024-11-15T08:30:00Z', country: 'USA', state: 'FL', city: 'Miami', zipcode: '33101', account_status: 'suspended' },
        { customer_id: 'C007', email: 'bob@example.com', signup_date: '2024-07-22', total_revenue: 890.00, last_activity: '2025-01-03T16:45:00Z', country: 'Germany', state: null, city: 'Berlin', zipcode: '10115', account_status: 'active' },
        { customer_id: 'C008', email: 'alice@example.com', signup_date: '2024-08-30', total_revenue: 1500.25, last_activity: '2025-01-06T12:00:00Z', country: 'France', state: null, city: 'Paris', zipcode: '75001', account_status: 'active' },
        { customer_id: 'C009', email: 'charlie@example.com', signup_date: '2024-09-14', total_revenue: 670.50, last_activity: '2025-01-02T10:15:00Z', country: 'Australia', state: 'NSW', city: 'Sydney', zipcode: '2000', account_status: 'Active' },
        { customer_id: 'C010', email: 'diana@example.com', signup_date: '2024-10-20', total_revenue: 2200.00, last_activity: '2025-01-06T14:30:00Z', country: 'USA', state: 'WA', city: 'Seattle', zipcode: '98101', account_status: 'active' }
      ],
      columns: ['customer_id', 'email', 'signup_date', 'total_revenue', 'last_activity', 'country', 'state', 'city', 'zipcode', 'account_status'],
      totalRows: 2500000,
      sampleSize: 10,
      executionTimeMs: 145
    }
  },
  {
    id: 'urn:li:dataset:(urn:li:dataPlatform:iceberg,support.tickets,PROD)',
    name: 'support_tickets',
    schema: 'support',
    database: 'iceberg_prod',
    qualityScore: 92,
    rowCount: 450000,
    lastUpdated: 'Hourly',
    description: 'Customer support tickets and resolutions',
    columns: [
      { name: 'ticket_id', type: 'string', description: 'Unique ticket ID', isPrimaryKey: true },
      { name: 'customer_id', type: 'string', description: 'Customer who created ticket' },
      { name: 'created_at', type: 'timestamp', description: 'Ticket creation time' },
      { name: 'resolved_at', type: 'timestamp', description: 'Ticket resolution time' },
      { name: 'resolution_time_hours', type: 'decimal', description: 'Time to resolve' },
      { name: 'category', type: 'string', description: 'Issue category' },
      { name: 'priority', type: 'string', description: 'Ticket priority level' },
      { name: 'status', type: 'string', description: 'Current ticket status' }
    ],
    quality: {
      overallScore: 92,
      completeness: {
        score: 88,
        status: 'medium',
        issues: [
          {
            column: 'resolved_at',
            type: 'null',
            count: 54000,
            percentage: 12,
            severity: 'medium',
            description: '12% null values (open tickets)'
          }
        ]
      },
      uniqueness: {
        score: 98,
        status: 'high',
        issues: [
          {
            column: 'ticket_id',
            type: 'duplicate',
            count: 9000,
            percentage: 2,
            severity: 'medium',
            description: '2% duplicates detected'
          }
        ]
      },
      freshness: {
        score: 99,
        status: 'high',
        lastUpdated: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
        expectedFrequency: 'hourly',
        isStale: false,
        updateHistory: [98, 99, 97, 99, 98, 99, 99]
      },
      validity: {
        score: 95,
        status: 'high'
      }
    },
    sampleData: {
      rows: [
        { ticket_id: 'T001', customer_id: 'C001', created_at: '2025-01-05T09:00:00Z', resolved_at: '2025-01-05T11:30:00Z', resolution_time_hours: 2.5, category: 'billing', priority: 'high', status: 'closed' },
        { ticket_id: 'T002', customer_id: 'C003', created_at: '2025-01-05T10:15:00Z', resolved_at: null, resolution_time_hours: null, category: 'technical', priority: 'medium', status: 'open' },
        { ticket_id: 'T003', customer_id: 'C002', created_at: '2025-01-05T11:45:00Z', resolved_at: '2025-01-05T13:00:00Z', resolution_time_hours: 1.25, category: 'account', priority: 'low', status: 'closed' },
        { ticket_id: 'T004', customer_id: 'C005', created_at: '2025-01-05T14:30:00Z', resolved_at: null, resolution_time_hours: null, category: 'billing', priority: 'high', status: 'in_progress' },
        { ticket_id: 'T005', customer_id: 'C007', created_at: '2025-01-06T08:00:00Z', resolved_at: '2025-01-06T09:15:00Z', resolution_time_hours: 1.25, category: 'technical', priority: 'medium', status: 'closed' },
        { ticket_id: 'T006', customer_id: 'C004', created_at: '2025-01-06T09:30:00Z', resolved_at: null, resolution_time_hours: null, category: 'feature_request', priority: 'low', status: 'open' },
        { ticket_id: 'T007', customer_id: 'C008', created_at: '2025-01-06T11:00:00Z', resolved_at: '2025-01-06T16:45:00Z', resolution_time_hours: 5.75, category: 'technical', priority: 'high', status: 'closed' },
        { ticket_id: 'T008', customer_id: 'C009', created_at: '2025-01-06T12:15:00Z', resolved_at: null, resolution_time_hours: null, category: 'billing', priority: 'medium', status: 'open' },
        { ticket_id: 'T009', customer_id: 'C010', created_at: '2025-01-06T13:45:00Z', resolved_at: '2025-01-06T14:30:00Z', resolution_time_hours: 0.75, category: 'account', priority: 'low', status: 'closed' },
        { ticket_id: 'T010', customer_id: 'C006', created_at: '2025-01-06T15:00:00Z', resolved_at: null, resolution_time_hours: null, category: 'technical', priority: 'high', status: 'escalated' }
      ],
      columns: ['ticket_id', 'customer_id', 'created_at', 'resolved_at', 'resolution_time_hours', 'category', 'priority', 'status'],
      totalRows: 450000,
      sampleSize: 10,
      executionTimeMs: 98
    }
  },
  {
    id: 'urn:li:dataset:(urn:li:dataPlatform:iceberg,sales.orders,PROD)',
    name: 'order_history',
    schema: 'sales',
    database: 'iceberg_prod',
    qualityScore: 95,
    rowCount: 12000000,
    lastUpdated: 'Real-time',
    description: 'All customer orders and transactions',
    columns: [
      { name: 'order_id', type: 'string', description: 'Unique order ID', isPrimaryKey: true },
      { name: 'customer_id', type: 'string', description: 'Customer who placed order' },
      { name: 'order_date', type: 'timestamp', description: 'Order placement time' },
      { name: 'total', type: 'decimal', description: 'Order total amount' },
      { name: 'status', type: 'string', description: 'Order status' },
      { name: 'items_count', type: 'integer', description: 'Number of items' },
      { name: 'shipping_method', type: 'string', description: 'Delivery method' },
      { name: 'payment_method', type: 'string', description: 'Payment type' }
    ],
    quality: {
      overallScore: 95,
      completeness: {
        score: 96,
        status: 'high',
        issues: [
          {
            column: 'shipping_method',
            type: 'null',
            count: 480000,
            percentage: 4,
            severity: 'low',
            description: '4% null values (digital orders)'
          }
        ]
      },
      uniqueness: {
        score: 99,
        status: 'high'
      },
      freshness: {
        score: 100,
        status: 'high',
        lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
        expectedFrequency: 'real-time',
        isStale: false,
        updateHistory: [99, 100, 99, 100, 100, 99, 100]
      },
      validity: {
        score: 93,
        status: 'high',
        issues: [
          {
            column: 'total',
            type: 'outlier',
            count: 840000,
            percentage: 7,
            severity: 'low',
            description: '7% outliers detected'
          }
        ]
      }
    },
    sampleData: {
      rows: [
        { order_id: 'O001', customer_id: 'C001', order_date: '2025-01-05T10:30:00Z', total: 125.50, status: 'delivered', items_count: 3, shipping_method: 'standard', payment_method: 'credit_card' },
        { order_id: 'O002', customer_id: 'C003', order_date: '2025-01-05T11:45:00Z', total: 89.99, status: 'shipped', items_count: 2, shipping_method: 'express', payment_method: 'paypal' },
        { order_id: 'O003', customer_id: 'C005', order_date: '2025-01-05T14:20:00Z', total: 450.00, status: 'processing', items_count: 5, shipping_method: null, payment_method: 'credit_card' },
        { order_id: 'O004', customer_id: 'C002', order_date: '2025-01-06T08:15:00Z', total: 32.50, status: 'delivered', items_count: 1, shipping_method: 'standard', payment_method: 'debit_card' },
        { order_id: 'O005', customer_id: 'C007', order_date: '2025-01-06T09:30:00Z', total: 210.75, status: 'shipped', items_count: 4, shipping_method: 'express', payment_method: 'credit_card' },
        { order_id: 'O006', customer_id: 'C004', order_date: '2025-01-06T10:45:00Z', total: 67.20, status: 'processing', items_count: 2, shipping_method: 'standard', payment_method: 'paypal' },
        { order_id: 'O007', customer_id: 'C008', order_date: '2025-01-06T12:00:00Z', total: 156.80, status: 'delivered', items_count: 3, shipping_method: 'express', payment_method: 'credit_card' },
        { order_id: 'O008', customer_id: 'C010', order_date: '2025-01-06T13:15:00Z', total: 890.50, status: 'shipped', items_count: 8, shipping_method: 'overnight', payment_method: 'wire_transfer' },
        { order_id: 'O009', customer_id: 'C009', order_date: '2025-01-06T14:30:00Z', total: 45.00, status: 'processing', items_count: 1, shipping_method: null, payment_method: 'credit_card' },
        { order_id: 'O010', customer_id: 'C006', order_date: '2025-01-06T15:45:00Z', total: 123.45, status: 'cancelled', items_count: 2, shipping_method: 'standard', payment_method: 'paypal' }
      ],
      columns: ['order_id', 'customer_id', 'order_date', 'total', 'status', 'items_count', 'shipping_method', 'payment_method'],
      totalRows: 12000000,
      sampleSize: 10,
      executionTimeMs: 234
    }
  }
];
