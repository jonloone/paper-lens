import { NextRequest, NextResponse } from 'next/server';

// Simulated data access for different product types
interface AccessRequest {
  format?: string;
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
}

// GET /api/products/[id]/access - Access data product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Check authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }
    
    // Simulate different data responses based on product ID
    let responseData: any;
    
    switch (params.id) {
      case 'dp-001': // Customer 360 API
        responseData = {
          customer: {
            id: 'cust-12345',
            name: 'John Doe',
            email: 'john.doe@example.com',
            segment: 'premium',
            lifetime_value: 15420.50,
            created_at: '2022-01-15T10:30:00Z',
            last_purchase: '2024-11-15T14:22:00Z',
            purchase_count: 47,
            average_order_value: 327.67,
            preferences: {
              categories: ['electronics', 'books'],
              communication: 'email',
              shipping: 'express'
            },
            risk_score: 0.12,
            churn_probability: 0.08
          },
          metadata: {
            version: '2.1.0',
            generated_at: new Date().toISOString(),
            quality_score: 94.5
          }
        };
        break;
        
      case 'dp-002': // ML Features
        responseData = {
          features: Array.from({ length: limit }, (_, i) => ({
            user_id: `user-${offset + i}`,
            product_embeddings: Array.from({ length: 128 }, () => Math.random()),
            interaction_features: Array.from({ length: 64 }, () => Math.random()),
            temporal_features: Array.from({ length: 32 }, () => Math.random()),
            timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
          })),
          metadata: {
            total_records: 50000,
            limit,
            offset,
            format,
            version: '1.3.0'
          }
        };
        break;
        
      case 'dp-003': // Sales Analytics
        responseData = {
          data: Array.from({ length: Math.min(limit, 30) }, (_, i) => ({
            date: new Date(Date.now() - (i + offset) * 86400000).toISOString().split('T')[0],
            region: ['North', 'South', 'East', 'West'][i % 4],
            total_sales: Math.floor(Math.random() * 100000) + 50000,
            transaction_count: Math.floor(Math.random() * 1000) + 500,
            average_transaction: Math.floor(Math.random() * 200) + 50,
            top_category: ['Electronics', 'Clothing', 'Food', 'Home'][i % 4],
            growth_rate: (Math.random() * 20 - 10).toFixed(2),
            forecast_accuracy: (Math.random() * 10 + 90).toFixed(1)
          })),
          summary: {
            total_sales: 2145000,
            period: 'last_30_days',
            growth: 5.4,
            regions: 4
          },
          metadata: {
            version: '3.0.1',
            updated_at: new Date().toISOString(),
            next_update: new Date(Date.now() + 86400000).toISOString()
          }
        };
        break;
        
      default:
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
    }
    
    // Format response based on requested format
    if (format === 'csv' && responseData.data) {
      // Convert to CSV format
      const csv = convertToCSV(responseData.data);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${params.id}-${Date.now()}.csv"`
        }
      });
    }
    
    // Track usage (in production, this would update metrics)
    console.log(`Data product ${params.id} accessed with format ${format}`);
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error accessing data product:', error);
    return NextResponse.json(
      { error: 'Failed to access data product' },
      { status: 500 }
    );
  }
}

// POST /api/products/[id]/access - Subscribe to data product
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate subscription request
    if (!body.subscriber || !body.purpose) {
      return NextResponse.json(
        { error: 'Subscriber and purpose required' },
        { status: 400 }
      );
    }
    
    // Generate API key for subscriber
    const apiKey = `sk-${params.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Create subscription response
    const subscription = {
      id: `sub-${Date.now()}`,
      productId: params.id,
      subscriber: body.subscriber,
      purpose: body.purpose,
      apiKey,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 86400000), // 1 year
      rateLimit: body.rateLimit || 1000,
      permissions: body.permissions || ['read'],
      status: 'active'
    };
    
    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Handle nested objects and arrays
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      // Escape commas and quotes
      return typeof value === 'string' && value.includes(',') 
        ? `"${value.replace(/"/g, '""')}"` 
        : value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}