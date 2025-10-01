/**
 * Contract Generation API
 *
 * Generates ODCS-compliant data contracts from parsed requests
 * Applies intelligent defaults based on organizational patterns
 * Validates and saves contracts to file system
 */

import { NextRequest, NextResponse } from 'next/server';
import { ODCSContract, QualityRule } from '@/lib/schemas/odcs-contract';
import { contractSerializer } from '@/lib/services/contract-serializer';
import { contractValidator } from '@/lib/validators/contract-validator';

interface ContractGenerationRequest {
  parsedRequest: {
    business_need: string;
    use_case: string;
    namespace: string;
    contract_name: string;
    inferred_schema: Array<{
      name: string;
      type: string;
      description: string;
    }>;
    sla: {
      freshness: string;
      availability: number;
      latency: string;
      criticality: 'low' | 'medium' | 'high' | 'critical';
    };
    quality_requirements: Array<{
      metric: string;
      threshold: string;
      description: string;
    }>;
    requester: string;
    stakeholders: string[];
  };
  version?: string;
  overrides?: Partial<ODCSContract>;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { parsedRequest, version = '1.0.0', overrides } = (await req.json()) as ContractGenerationRequest;

    if (!parsedRequest) {
      return NextResponse.json(
        { success: false, error: 'parsedRequest is required' },
        { status: 400 }
      );
    }

    // Generate contract from parsed request
    const contract = await generateContract(parsedRequest, version, overrides);

    // Validate contract
    const validation = contractValidator.validate(contract);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contract validation failed',
          validation_errors: validation.errors.map(e => e.message)
        },
        { status: 400 }
      );
    }

    // Save contract to file system
    const savedPath = await contractSerializer.saveContract(contract);

    return NextResponse.json({
      success: true,
      contract,
      saved_path: savedPath,
      validation: {
        valid: true,
        warnings: validation.warnings.map(w => w.message)
      }
    });
  } catch (error) {
    console.error('Contract generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate contract'
      },
      { status: 500 }
    );
  }
}

async function generateContract(
  parsedRequest: ContractGenerationRequest['parsedRequest'],
  version: string,
  overrides?: Partial<ODCSContract>
): Promise<ODCSContract> {
  const now = new Date();

  // Map inferred schema to contract schema format
  const schemaFields = parsedRequest.inferred_schema.map(field => {
    const baseField: any = {
      name: field.name,
      type: field.type as any,
      description: field.description,
      required: true // Default to required
    };

    // Add constraints based on type
    if (field.type === 'float' && field.name.includes('score')) {
      baseField.constraints = { min: 0, max: 1 };
    } else if (field.type === 'string' && field.name.includes('id')) {
      baseField.constraints = { min_length: 1 };
    }

    return baseField;
  });

  // Generate quality rules from requirements
  const qualityRules: QualityRule[] = [];

  // Add completeness rules for required fields
  for (const field of schemaFields) {
    if (field.required) {
      qualityRules.push({
        type: 'completeness',
        column: field.name,
        expectation: 'expect_column_values_to_not_be_null',
        parameters: {},
        severity: 'critical',
        description: `Ensure ${field.name} has no missing values`
      });
    }
  }

  // Add quality rules from parsed requirements
  for (const req of parsedRequest.quality_requirements) {
    if (req.metric === 'accuracy') {
      // Add statistical validation rule
      qualityRules.push({
        type: 'validity',
        column: schemaFields[0]?.name || 'id',
        expectation: 'expect_column_proportion_of_unique_values_to_be_between',
        parameters: {
          min_value: parseFloat(req.threshold.replace('>', '').replace('%', '')) / 100,
          max_value: 1.0
        },
        severity: 'critical',
        description: req.description
      });
    } else if (req.metric === 'uniqueness') {
      const idField = schemaFields.find(f => f.name.includes('id'));
      if (idField) {
        qualityRules.push({
          type: 'uniqueness',
          column: idField.name,
          expectation: 'expect_column_values_to_be_unique',
          parameters: {},
          severity: 'critical',
          description: `Ensure ${idField.name} contains unique values`
        });
      }
    }
  }

  // Build the contract
  const contract: ODCSContract = {
    kind: 'DataContract',
    apiVersion: 'v4.0',
    metadata: {
      name: parsedRequest.contract_name,
      namespace: parsedRequest.namespace,
      version,
      description: parsedRequest.use_case,
      owner: parsedRequest.requester,
      created_at: now,
      updated_at: now,
      tags: ['auto_generated', 'nexus_one', parsedRequest.business_need],
      use_cases: [parsedRequest.use_case],
      domain: parsedRequest.namespace,
      classification: 'internal' // Default classification
    },
    schema: {
      fields: schemaFields
    },
    quality: qualityRules,
    sla: {
      freshness: parsedRequest.sla.freshness,
      availability: parsedRequest.sla.availability,
      latency: parsedRequest.sla.latency,
      criticality: parsedRequest.sla.criticality
    },
    sources: [], // Will be filled in during implementation
    status: 'draft',
    lineage: {
      upstream: [],
      downstream: []
    },
    ...overrides
  };

  return contract;
}

/**
 * GET endpoint to validate an existing contract
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const namespace = searchParams.get('namespace');
  const version = searchParams.get('version');

  if (!namespace || !version) {
    return NextResponse.json(
      { success: false, error: 'namespace and version are required' },
      { status: 400 }
    );
  }

  try {
    const result = await contractSerializer.loadContract(namespace, version);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Contract not found', errors: result.errors },
        { status: 404 }
      );
    }

    const validation = contractValidator.validate(result.data!);

    return NextResponse.json({
      success: true,
      contract: result.data,
      validation: {
        valid: validation.valid,
        errors: validation.errors.map(e => e.message),
        warnings: validation.warnings.map(w => w.message)
      }
    });
  } catch (error) {
    console.error('Contract validation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate contract'
      },
      { status: 500 }
    );
  }
}
