/**
 * Profiling Upload API
 *
 * Handles CSV/Parquet/JSON file uploads for data profiling
 * Generates contract inference from existing data
 * Alternative entry point to natural language request
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { profilingGenerator } from '@/lib/generators/profiling-generator';

const UPLOAD_DIR = '/tmp/nexus-one-uploads';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const namespace = formData.get('namespace') as string;
    const contractName = formData.get('contract_name') as string;
    const owner = formData.get('owner') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File is required' },
        { status: 400 }
      );
    }

    if (!namespace || !contractName || !owner) {
      return NextResponse.json(
        { success: false, error: 'namespace, contract_name, and owner are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    const fileType = getFileType(fileName);

    if (!fileType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unsupported file type. Supported: .csv, .parquet, .json'
        },
        { status: 400 }
      );
    }

    // Save file to temp directory
    await mkdir(UPLOAD_DIR, { recursive: true });
    const tempFilePath = join(UPLOAD_DIR, `${Date.now()}-${file.name}`);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(tempFilePath, buffer);

    // Profile the dataset and infer contract
    const result = await profilingGenerator.generateFromProfiling({
      data_source: tempFilePath,
      source_type: fileType,
      namespace,
      contract_name: contractName,
      owner,
      description: description || `Data product inferred from ${file.name}`,
      version: '1.0.0'
    });

    // Extract key metrics for UI display
    const profilingSummary = {
      rows: result.profiling.dataset_info.n_rows,
      columns: result.profiling.dataset_info.columns,
      memory_size_mb: result.profiling.dataset_info.memory_size,
      profiled_at: result.profiling.dataset_info.profiled_at
    };

    const inferenceSummary = {
      confidence: result.inference.metadata.confidence,
      fields_inferred: result.inference.contract.schema.fields.length,
      quality_rules_inferred: result.inference.contract.quality.length,
      review_items: result.inference.metadata.review_items
    };

    return NextResponse.json({
      success: true,
      contract: result.inference.contract,
      profiling_summary: profilingSummary,
      inference_summary: inferenceSummary,
      recommendations: result.comparison?.recommendations || [],
      temp_file_path: tempFilePath
    });
  } catch (error) {
    console.error('Profiling upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to profile data'
      },
      { status: 500 }
    );
  }
}

function getFileType(fileName: string): 'csv' | 'parquet' | 'json' | null {
  if (fileName.endsWith('.csv')) return 'csv';
  if (fileName.endsWith('.parquet')) return 'parquet';
  if (fileName.endsWith('.json')) return 'json';
  return null;
}

/**
 * GET endpoint to retrieve profiling report
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const namespace = searchParams.get('namespace');
  const version = searchParams.get('version');
  const contractName = searchParams.get('contract_name');

  if (!namespace || !version || !contractName) {
    return NextResponse.json(
      { success: false, error: 'namespace, version, and contract_name are required' },
      { status: 400 }
    );
  }

  try {
    // Load profiling report from file system
    const reportPath = `/mnt/blockstorage/paper-lens/data-products/contracts/${namespace}/v${version}/PROFILING_REPORT.md`;

    const fs = require('fs/promises');
    const report = await fs.readFile(reportPath, 'utf-8');

    return NextResponse.json({
      success: true,
      report,
      report_path: reportPath
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Profiling report not found'
      },
      { status: 404 }
    );
  }
}
