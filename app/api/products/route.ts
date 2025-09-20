import { NextRequest, NextResponse } from 'next/server';

// Types for data products
export interface DataProduct {
  id: string;
  name: string;
  description: string;
  category: 'dataset' | 'api' | 'ml-feature' | 'report';
  type: 'batch' | 'streaming' | 'real-time';
  status: 'active' | 'deprecated' | 'development' | 'archived';
  owner: string;
  team: string;
  version: string;
  created: Date;
  updated: Date;
  lastAccessed?: Date;
  
  // Quality metrics
  quality: {
    score: number;
    completeness: number;
    accuracy: number;
    consistency: number;
    validity: number;
    uniqueness: number;
    timeliness: number;
    lastValidated: Date;
  };
  
  // Access configuration
  access: {
    type: 'public' | 'internal' | 'restricted';
    authentication: 'none' | 'api-key' | 'oauth' | 'jwt';
    rateLimit?: number;
    allowedOrigins?: string[];
    permissions?: string[];
  };
  
  // Technical details
  technical: {
    format: string[];
    schema?: any;
    endpoint?: string;
    documentation?: string;
    sla?: {
      availability: number;
      latency: number;
      throughput: number;
    };
  };
  
  // Usage metrics
  usage: {
    subscribers: number;
    monthlyRequests: number;
    averageLatency: number;
    errorRate: number;
    topConsumers: string[];
  };
  
  // Lineage
  lineage: {
    sources: string[];
    transformations: string[];
    destinations: string[];
    dependencies: string[];
  };
  
  tags: string[];
}

// In-memory storage for demo
const dataProducts = new Map<string, DataProduct>();

// Initialize with sample data products
const initializeSampleProducts = () => {
  const sampleProducts: DataProduct[] = [
    {
      id: 'dp-001',
      name: 'Customer 360 API',
      description: 'Unified customer profile with purchase history and preferences',
      category: 'api',
      type: 'real-time',
      status: 'active',
      owner: 'Data Platform Team',
      team: 'Platform',
      version: '2.1.0',
      created: new Date('2024-01-15'),
      updated: new Date('2024-11-20'),
      lastAccessed: new Date(),
      quality: {
        score: 94.5,
        completeness: 98,
        accuracy: 96,
        consistency: 94,
        validity: 92,
        uniqueness: 100,
        timeliness: 87,
        lastValidated: new Date()
      },
      access: {
        type: 'internal',
        authentication: 'jwt',
        rateLimit: 1000,
        allowedOrigins: ['*.company.com'],
        permissions: ['read:customer', 'read:transactions']
      },
      technical: {
        format: ['json', 'parquet'],
        endpoint: '/api/v2/customers/{id}',
        documentation: '/docs/customer-360',
        sla: {
          availability: 99.9,
          latency: 100,
          throughput: 1000
        }
      },
      usage: {
        subscribers: 24,
        monthlyRequests: 1250000,
        averageLatency: 45,
        errorRate: 0.02,
        topConsumers: ['Marketing Team', 'Sales Dashboard', 'ML Pipeline']
      },
      lineage: {
        sources: ['CRM Database', 'Transaction System', 'Support Tickets'],
        transformations: ['dbt_customer_aggregation', 'spark_feature_engineering'],
        destinations: ['Customer Dashboard', 'ML Training Pipeline'],
        dependencies: ['User Service', 'Transaction API']
      },
      tags: ['customer', 'profile', 'real-time', 'critical']
    },
    {
      id: 'dp-002',
      name: 'Product Recommendation Features',
      description: 'ML-ready features for product recommendation models',
      category: 'ml-feature',
      type: 'batch',
      status: 'active',
      owner: 'ML Engineering',
      team: 'Data Science',
      version: '1.3.0',
      created: new Date('2024-03-10'),
      updated: new Date('2024-11-18'),
      quality: {
        score: 91.2,
        completeness: 95,
        accuracy: 93,
        consistency: 90,
        validity: 88,
        uniqueness: 98,
        timeliness: 83,
        lastValidated: new Date()
      },
      access: {
        type: 'internal',
        authentication: 'api-key',
        rateLimit: 500
      },
      technical: {
        format: ['parquet', 'tfrecord'],
        schema: {
          user_id: 'string',
          product_embeddings: 'array<float>',
          interaction_features: 'array<float>',
          temporal_features: 'array<float>'
        }
      },
      usage: {
        subscribers: 8,
        monthlyRequests: 45000,
        averageLatency: 250,
        errorRate: 0.01,
        topConsumers: ['Recommendation Service', 'A/B Testing Platform']
      },
      lineage: {
        sources: ['User Behavior Logs', 'Product Catalog', 'Transaction History'],
        transformations: ['feature_engineering_pipeline', 'embedding_generation'],
        destinations: ['Model Training', 'Feature Store'],
        dependencies: ['Spark Cluster', 'Feature Store API']
      },
      tags: ['ml', 'features', 'recommendations', 'batch']
    },
    {
      id: 'dp-003',
      name: 'Sales Analytics Dataset',
      description: 'Daily sales metrics with regional breakdowns',
      category: 'dataset',
      type: 'batch',
      status: 'active',
      owner: 'Analytics Team',
      team: 'Business Intelligence',
      version: '3.0.1',
      created: new Date('2023-11-01'),
      updated: new Date('2024-11-19'),
      quality: {
        score: 97.8,
        completeness: 99,
        accuracy: 98,
        consistency: 97,
        validity: 96,
        uniqueness: 100,
        timeliness: 95,
        lastValidated: new Date()
      },
      access: {
        type: 'public',
        authentication: 'none'
      },
      technical: {
        format: ['csv', 'parquet', 'json'],
        documentation: '/docs/sales-analytics'
      },
      usage: {
        subscribers: 42,
        monthlyRequests: 85000,
        averageLatency: 150,
        errorRate: 0.005,
        topConsumers: ['Executive Dashboard', 'Finance Team', 'Regional Managers']
      },
      lineage: {
        sources: ['POS System', 'Inventory Database', 'Regional DBs'],
        transformations: ['daily_aggregation', 'regional_rollup'],
        destinations: ['BI Tools', 'Executive Reports'],
        dependencies: ['ETL Pipeline', 'Data Warehouse']
      },
      tags: ['sales', 'analytics', 'daily', 'public']
    }
  ];
  
  sampleProducts.forEach(product => {
    dataProducts.set(product.id, product);
  });
};

// Initialize sample data
initializeSampleProducts();

// GET /api/products - List all data products or search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const team = searchParams.get('team');
    
    let products = Array.from(dataProducts.values());
    
    // Apply filters
    if (category) {
      products = products.filter(p => p.category === category);
    }
    
    if (status) {
      products = products.filter(p => p.status === status);
    }
    
    if (team) {
      products = products.filter(p => p.team === team);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort by quality score by default
    products.sort((a, b) => b.quality.score - a.quality.score);
    
    return NextResponse.json({
      products,
      total: products.length,
      categories: {
        dataset: products.filter(p => p.category === 'dataset').length,
        api: products.filter(p => p.category === 'api').length,
        'ml-feature': products.filter(p => p.category === 'ml-feature').length,
        report: products.filter(p => p.category === 'report').length
      }
    });
  } catch (error) {
    console.error('Error fetching data products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new data product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.category || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new data product
    const product: DataProduct = {
      id: `dp-${Date.now()}`,
      name: body.name,
      description: body.description || '',
      category: body.category,
      type: body.type,
      status: body.status || 'development',
      owner: body.owner || 'Unknown',
      team: body.team || 'Default',
      version: body.version || '1.0.0',
      created: new Date(),
      updated: new Date(),
      quality: body.quality || {
        score: 0,
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        validity: 0,
        uniqueness: 0,
        timeliness: 0,
        lastValidated: new Date()
      },
      access: body.access || {
        type: 'internal',
        authentication: 'api-key'
      },
      technical: body.technical || {
        format: ['json']
      },
      usage: {
        subscribers: 0,
        monthlyRequests: 0,
        averageLatency: 0,
        errorRate: 0,
        topConsumers: []
      },
      lineage: body.lineage || {
        sources: [],
        transformations: [],
        destinations: [],
        dependencies: []
      },
      tags: body.tags || []
    };
    
    // Store product
    dataProducts.set(product.id, product);
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating data product:', error);
    return NextResponse.json(
      { error: 'Failed to create data product' },
      { status: 500 }
    );
  }
}

// PUT /api/products - Update data product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Product ID required' },
        { status: 400 }
      );
    }
    
    const product = dataProducts.get(body.id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Update product
    const updatedProduct = {
      ...product,
      ...body,
      updated: new Date()
    };
    
    dataProducts.set(body.id, updatedProduct);
    
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating data product:', error);
    return NextResponse.json(
      { error: 'Failed to update data product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products?id=xxx - Delete data product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID required' },
        { status: 400 }
      );
    }
    
    if (!dataProducts.has(id)) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    dataProducts.delete(id);
    
    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting data product:', error);
    return NextResponse.json(
      { error: 'Failed to delete data product' },
      { status: 500 }
    );
  }
}