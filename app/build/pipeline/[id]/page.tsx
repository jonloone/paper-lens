'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Info, Database, Settings, GitBranch, Activity, Shield, Save, Play, Clock, Users, Zap, Server, Code, Terminal, FileText, RefreshCw, X } from 'lucide-react'
import { TechIcon } from '@/components/ui/tech-icon'

interface PipelineConfig {
  id: string
  name: string
  description: string
  requirements: {
    businessPurpose: string
    dataProducts: string[]
    sla: string
    dataVolume: string
    frequency: string
    stakeholders: string[]
  }
  sources: {
    connections: Array<{
      id: string
      type: string
      name: string
      tables?: string[]
      topics?: string[]
      paths?: string[]
      validated: boolean
      schema?: any
    }>
  }
  processing: {
    engine: 'spark' | 'dbt' | 'nifi' | 'custom'
    transformations: Array<{
      id: string
      name: string
      type: string
      config: any
    }>
    qualityChecks: Array<{
      id: string
      name: string
      type: string
      threshold: number
    }>
  }
  orchestration: {
    scheduler: 'airflow' | 'prefect' | 'dagster'
    schedule: string
    dependencies: string[]
    retryPolicy: {
      attempts: number
      delay: number
    }
    notifications: {
      onSuccess: string[]
      onFailure: string[]
    }
  }
  monitoring: {
    metrics: string[]
    alerts: Array<{
      condition: string
      threshold: number
      severity: 'low' | 'medium' | 'high'
    }>
    slos: Array<{
      metric: string
      target: number
    }>
  }
}

const STEPS = [
  { id: 'requirements', label: 'Define Requirements', icon: FileText },
  { id: 'sources', label: 'Select Data Sources', icon: Database },
  { id: 'processing', label: 'Configure Processing', icon: Settings },
  { id: 'orchestration', label: 'Set Up Orchestration', icon: GitBranch },
  { id: 'monitoring', label: 'Configure Monitoring', icon: Activity }
]

export default function PipelineBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [config, setConfig] = useState<PipelineConfig>({
    id: params.id as string,
    name: '',
    description: '',
    requirements: {
      businessPurpose: '',
      dataProducts: [],
      sla: '99.9%',
      dataVolume: 'medium',
      frequency: 'daily',
      stakeholders: []
    },
    sources: {
      connections: []
    },
    processing: {
      engine: 'spark',
      transformations: [],
      qualityChecks: []
    },
    orchestration: {
      scheduler: 'airflow',
      schedule: '0 6 * * *',
      dependencies: [],
      retryPolicy: {
        attempts: 3,
        delay: 300
      },
      notifications: {
        onSuccess: [],
        onFailure: []
      }
    },
    monitoring: {
      metrics: ['completeness', 'latency', 'error_rate'],
      alerts: [],
      slos: []
    }
  })

  const [validationStatus, setValidationStatus] = useState<Record<string, boolean>>({})
  const [isValidating, setIsValidating] = useState(false)
  const [showToolCoordination, setShowToolCoordination] = useState(false)

  // Simulated available connections
  const availableConnections = [
    { id: 'pg-prod', type: 'postgresql', name: 'Production PostgreSQL', status: 'healthy' },
    { id: 'mysql-analytics', type: 'mysql', name: 'Analytics MySQL', status: 'healthy' },
    { id: 'kafka-events', type: 'kafka', name: 'Event Stream', status: 'healthy' },
    { id: 's3-datalake', type: 'aws', name: 'S3 Data Lake', status: 'healthy' },
    { id: 'trino-warehouse', type: 'trino', name: 'Trino Warehouse', status: 'degraded' },
    { id: 'mongo-app', type: 'mongodb', name: 'Application MongoDB', status: 'healthy' }
  ]

  const validateConnection = async (connectionId: string) => {
    setIsValidating(true)
    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 1500))
    setValidationStatus(prev => ({ ...prev, [connectionId]: true }))
    setIsValidating(false)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Define Requirements
        return (
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-100">
                    Start by defining the business context. This will guide tool selection and configuration throughout the pipeline.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pipeline Name *
                  </label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g., Customer 360 ETL"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Business Purpose *
                  </label>
                  <textarea
                    value={config.requirements.businessPurpose}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      requirements: { ...prev.requirements, businessPurpose: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    rows={3}
                    placeholder="What business problem does this pipeline solve?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Data Products
                  </label>
                  <div className="space-y-2">
                    {['Customer Profile', 'Transaction History', 'Risk Score'].map(product => (
                      <label key={product} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.requirements.dataProducts.includes(product)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setConfig(prev => ({
                                ...prev,
                                requirements: {
                                  ...prev.requirements,
                                  dataProducts: [...prev.requirements.dataProducts, product]
                                }
                              }))
                            } else {
                              setConfig(prev => ({
                                ...prev,
                                requirements: {
                                  ...prev.requirements,
                                  dataProducts: prev.requirements.dataProducts.filter(p => p !== product)
                                }
                              }))
                            }
                          }}
                          className="rounded border-gray-600 bg-gray-800 text-blue-500"
                        />
                        <span className="text-sm text-gray-300">{product}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Processing Frequency
                  </label>
                  <select
                    value={config.requirements.frequency}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      requirements: { ...prev.requirements, frequency: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="real-time">Real-time</option>
                    <option value="near-real-time">Near Real-time (5 min)</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expected Data Volume
                  </label>
                  <select
                    value={config.requirements.dataVolume}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      requirements: { ...prev.requirements, dataVolume: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="small">Small (&lt; 1GB/day)</option>
                    <option value="medium">Medium (1-100GB/day)</option>
                    <option value="large">Large (100GB-1TB/day)</option>
                    <option value="xlarge">X-Large (&gt; 1TB/day)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    SLA Requirement
                  </label>
                  <select
                    value={config.requirements.sla}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      requirements: { ...prev.requirements, sla: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="99.99%">99.99% (52 min/year downtime)</option>
                    <option value="99.9%">99.9% (8.7 hrs/year downtime)</option>
                    <option value="99.5%">99.5% (1.8 days/year downtime)</option>
                    <option value="99%">99% (3.65 days/year downtime)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Key Stakeholders
                  </label>
                  <input
                    type="text"
                    placeholder="Enter email addresses, separated by commas"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      requirements: { ...prev.requirements, stakeholders: e.target.value.split(',').map(s => s.trim()) }
                    }))}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Recommended Architecture</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Based on your requirements, we recommend:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Processing Engine: {config.requirements.frequency === 'real-time' ? 'Kafka + Flink' : 'Spark'}</li>
                  <li>Orchestration: {config.requirements.frequency === 'real-time' ? 'Kubernetes Jobs' : 'Airflow'}</li>
                  <li>Storage: {config.requirements.dataVolume === 'small' ? 'PostgreSQL' : 'S3 + Trino'}</li>
                  <li>Monitoring: DataDog + Custom Alerts</li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 1: // Select Data Sources
        return (
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-100">
                    Select and validate your data sources. We'll check connectivity and schema compatibility.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">Available Connections</h3>
                <div className="space-y-2">
                  {availableConnections.map(conn => (
                    <div
                      key={conn.id}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <TechIcon technology={conn.type} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-white">{conn.name}</p>
                          <p className="text-xs text-gray-400">ID: {conn.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          conn.status === 'healthy' ? 'bg-green-500/20 text-green-400' :
                          conn.status === 'degraded' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {conn.status}
                        </span>
                        <button
                          onClick={() => {
                            setConfig(prev => ({
                              ...prev,
                              sources: {
                                connections: [...prev.sources.connections, {
                                  id: conn.id,
                                  type: conn.type,
                                  name: conn.name,
                                  validated: false
                                }]
                              }
                            }))
                          }}
                          disabled={config.sources.connections.some(c => c.id === conn.id)}
                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500"
                        >
                          {config.sources.connections.some(c => c.id === conn.id) ? 'Added' : 'Add'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">Selected Sources</h3>
                <div className="space-y-2">
                  {config.sources.connections.length === 0 ? (
                    <div className="p-8 bg-gray-800/50 rounded-lg border border-gray-700 text-center">
                      <Database className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No sources selected</p>
                    </div>
                  ) : (
                    config.sources.connections.map(conn => (
                      <div key={conn.id} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <TechIcon technology={conn.type} size="sm" />
                            <span className="text-sm font-medium text-white">{conn.name}</span>
                          </div>
                          <button
                            onClick={() => {
                              setConfig(prev => ({
                                ...prev,
                                sources: {
                                  connections: prev.sources.connections.filter(c => c.id !== conn.id)
                                }
                              }))
                            }}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {!conn.validated ? (
                          <button
                            onClick={() => validateConnection(conn.id)}
                            disabled={isValidating}
                            className="w-full px-3 py-2 bg-gray-700 text-sm text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50"
                          >
                            {isValidating ? (
                              <span className="flex items-center justify-center gap-2">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Validating...
                              </span>
                            ) : (
                              'Validate Connection'
                            )}
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-green-400 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              <span>Connection validated</span>
                            </div>
                            <div className="pl-6 space-y-1">
                              <p className="text-xs text-gray-400">Available objects:</p>
                              <div className="text-xs text-gray-300">
                                {conn.type === 'postgresql' && '• 12 tables, 47 views'}
                                {conn.type === 'kafka' && '• 8 topics, 2.3M msgs/day'}
                                {conn.type === 'aws' && '• 3 buckets, 1.2TB data'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {config.sources.connections.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-xs text-yellow-400">
                      Validation checks connectivity, permissions, and schema access. Failed validations will need to be resolved before deployment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 2: // Configure Processing
        return (
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-100">
                    Choose your processing engine and define transformations. We'll generate the initial code templates.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Processing Engine
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'spark', name: 'Apache Spark', desc: 'Large-scale batch & streaming' },
                      { id: 'dbt', name: 'dbt', desc: 'SQL transformations' },
                      { id: 'nifi', name: 'Apache NiFi', desc: 'Visual dataflow' },
                      { id: 'custom', name: 'Custom', desc: 'Python/Java/Scala' }
                    ].map(engine => (
                      <button
                        key={engine.id}
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          processing: { ...prev.processing, engine: engine.id as any }
                        }))}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          config.processing.engine === engine.id
                            ? 'bg-blue-600/20 border-blue-500 text-blue-100'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <TechIcon technology={engine.id} size="xs" />
                          <span className="text-sm font-medium">{engine.name}</span>
                        </div>
                        <p className="text-xs text-gray-400">{engine.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Transformation Steps
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowToolCoordination(true)}
                      className="w-full px-3 py-2 bg-gray-800 border border-dashed border-gray-600 rounded-lg text-sm text-gray-400 hover:border-gray-500 hover:text-gray-300"
                    >
                      + Add Transformation
                    </button>
                    {config.processing.transformations.map((transform, idx) => (
                      <div key={transform.id} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white">{idx + 1}. {transform.name}</span>
                          <span className="text-xs text-gray-400">{transform.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data Quality Checks
                  </label>
                  <div className="space-y-2">
                    {['Completeness', 'Uniqueness', 'Validity', 'Consistency'].map(check => (
                      <label key={check} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded border-gray-600 bg-gray-800 text-blue-500"
                        />
                        <span className="text-sm text-gray-300">{check}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Generated Code Template</h4>
                  <pre className="text-xs text-gray-400 font-mono overflow-x-auto">
{`# ${config.processing.engine === 'spark' ? 'PySpark' : config.processing.engine === 'dbt' ? 'SQL' : 'Python'} Pipeline
${config.processing.engine === 'spark' ? `
from pyspark.sql import SparkSession
from pyspark.sql.functions import *

spark = SparkSession.builder\\
    .appName("${config.name}")\\
    .getOrCreate()

# Load source data
df = spark.read.parquet("s3://bucket/path")

# Apply transformations
df_transformed = df\\
    .filter(col("status") == "active")\\
    .groupBy("customer_id")\\
    .agg(sum("amount").alias("total"))

# Write results
df_transformed.write\\
    .mode("overwrite")\\
    .parquet("s3://bucket/output")
` : config.processing.engine === 'dbt' ? `
-- models/${config.name.toLowerCase().replace(/\s+/g, '_')}.sql
WITH source AS (
    SELECT * FROM {{ source('raw', 'customers') }}
),

transformed AS (
    SELECT
        customer_id,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
    FROM source
    WHERE status = 'active'
    GROUP BY customer_id
)

SELECT * FROM transformed
` : `
import pandas as pd
from datetime import datetime

def process_data():
    # Load data
    df = pd.read_csv('input.csv')
    
    # Transform
    df_grouped = df.groupby('customer_id').agg({
        'amount': 'sum',
        'transaction_id': 'count'
    })
    
    # Save results
    df_grouped.to_csv('output.csv')
    
if __name__ == "__main__":
    process_data()
`}`}
                  </pre>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Resource Requirements</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">CPU Cores:</span>
                      <span className="text-gray-200">8-16 cores</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Memory:</span>
                      <span className="text-gray-200">32-64 GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Storage:</span>
                      <span className="text-gray-200">~500 GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Est. Cost:</span>
                      <span className="text-green-400">$450/month</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 3: // Set Up Orchestration
        return (
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-100">
                    Configure scheduling, dependencies, and error handling. We'll generate the DAG configuration.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Orchestration Platform
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'airflow', name: 'Apache Airflow', desc: 'Most popular, extensive integrations' },
                      { id: 'prefect', name: 'Prefect', desc: 'Modern Python-native workflows' },
                      { id: 'dagster', name: 'Dagster', desc: 'Data-aware orchestration' }
                    ].map(platform => (
                      <button
                        key={platform.id}
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          orchestration: { ...prev.orchestration, scheduler: platform.id as any }
                        }))}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          config.orchestration.scheduler === platform.id
                            ? 'bg-blue-600/20 border-blue-500'
                            : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <TechIcon technology={platform.id} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-white">{platform.name}</p>
                              <p className="text-xs text-gray-400">{platform.desc}</p>
                            </div>
                          </div>
                          {config.orchestration.scheduler === platform.id && (
                            <CheckCircle className="h-4 w-4 text-blue-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Schedule (Cron Expression)
                  </label>
                  <input
                    type="text"
                    value={config.orchestration.schedule}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      orchestration: { ...prev.orchestration, schedule: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="0 6 * * * (daily at 6am)"
                  />
                  <div className="mt-2 flex gap-2">
                    {['@hourly', '@daily', '@weekly'].map(preset => (
                      <button
                        key={preset}
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          orchestration: { ...prev.orchestration, schedule: preset }
                        }))}
                        className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Retry Policy
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Max Attempts</label>
                      <input
                        type="number"
                        value={config.orchestration.retryPolicy.attempts}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          orchestration: {
                            ...prev.orchestration,
                            retryPolicy: { ...prev.orchestration.retryPolicy, attempts: parseInt(e.target.value) }
                          }
                        }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Delay (seconds)</label>
                      <input
                        type="number"
                        value={config.orchestration.retryPolicy.delay}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          orchestration: {
                            ...prev.orchestration,
                            retryPolicy: { ...prev.orchestration.retryPolicy, delay: parseInt(e.target.value) }
                          }
                        }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dependencies
                  </label>
                  <select
                    multiple
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    size={3}
                  >
                    <option>upstream_etl_pipeline</option>
                    <option>data_validation_job</option>
                    <option>external_api_sync</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Ctrl+Click to select multiple</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Generated DAG Configuration</h4>
                  <pre className="text-xs text-gray-400 font-mono overflow-x-auto">
{config.orchestration.scheduler === 'airflow' ? `from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'data-team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'retries': ${config.orchestration.retryPolicy.attempts},
    'retry_delay': timedelta(seconds=${config.orchestration.retryPolicy.delay}),
}

dag = DAG(
    '${config.name.toLowerCase().replace(/\s+/g, '_')}',
    default_args=default_args,
    schedule_interval='${config.orchestration.schedule}',
    catchup=False,
)

# Task definitions
extract = PythonOperator(
    task_id='extract_data',
    python_callable=extract_function,
    dag=dag,
)

transform = PythonOperator(
    task_id='transform_data',
    python_callable=transform_function,
    dag=dag,
)

load = PythonOperator(
    task_id='load_data',
    python_callable=load_function,
    dag=dag,
)

# Set dependencies
extract >> transform >> load` : `# Prefect Flow Configuration
from prefect import flow, task
from prefect.schedules import CronSchedule

@task(retries=${config.orchestration.retryPolicy.attempts})
def extract_data():
    pass

@task(retries=${config.orchestration.retryPolicy.attempts})
def transform_data():
    pass

@task(retries=${config.orchestration.retryPolicy.attempts})
def load_data():
    pass

@flow(
    name="${config.name}",
    schedule=CronSchedule(cron="${config.orchestration.schedule}")
)
def etl_pipeline():
    data = extract_data()
    transformed = transform_data(data)
    load_data(transformed)`}
                  </pre>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Notification Settings</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400">On Success</label>
                      <input
                        type="text"
                        placeholder="Email addresses or Slack channels"
                        className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">On Failure</label>
                      <input
                        type="text"
                        placeholder="Email addresses or Slack channels"
                        className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 4: // Configure Monitoring
        return (
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-100">
                    Set up monitoring, alerts, and SLOs. These will be automatically configured in DataDog and integrated tools.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Key Metrics to Track
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'completeness', label: 'Data Completeness', icon: CheckCircle },
                      { id: 'latency', label: 'Processing Latency', icon: Clock },
                      { id: 'error_rate', label: 'Error Rate', icon: AlertCircle },
                      { id: 'throughput', label: 'Throughput', icon: Zap },
                      { id: 'cost', label: 'Processing Cost', icon: Server }
                    ].map(metric => (
                      <label key={metric.id} className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                        <input
                          type="checkbox"
                          checked={config.monitoring.metrics.includes(metric.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setConfig(prev => ({
                                ...prev,
                                monitoring: {
                                  ...prev.monitoring,
                                  metrics: [...prev.monitoring.metrics, metric.id]
                                }
                              }))
                            } else {
                              setConfig(prev => ({
                                ...prev,
                                monitoring: {
                                  ...prev.monitoring,
                                  metrics: prev.monitoring.metrics.filter(m => m !== metric.id)
                                }
                              }))
                            }
                          }}
                          className="rounded border-gray-600 bg-gray-700 text-blue-500"
                        />
                        <metric.icon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{metric.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Alert Rules
                  </label>
                  <div className="space-y-2">
                    <button className="w-full px-3 py-2 bg-gray-800 border border-dashed border-gray-600 rounded-lg text-sm text-gray-400 hover:border-gray-500 hover:text-gray-300">
                      + Add Alert Rule
                    </button>
                    <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">Pipeline Failure</span>
                        <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">High</span>
                      </div>
                      <p className="text-xs text-gray-400">When error_rate > 5% for 5 minutes</p>
                    </div>
                    <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">High Latency</span>
                        <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">Medium</span>
                      </div>
                      <p className="text-xs text-gray-400">When p95_latency > 30s for 10 minutes</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Service Level Objectives (SLOs)
                  </label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400">Availability</label>
                        <input
                          type="text"
                          defaultValue="99.9%"
                          className="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Latency P95</label>
                        <input
                          type="text"
                          defaultValue="< 30s"
                          className="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Monitoring Dashboard Preview</h4>
                  <div className="space-y-3">
                    <div className="h-24 bg-gray-700/50 rounded flex items-center justify-center text-gray-500 text-sm">
                      Pipeline Success Rate Chart
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-16 bg-gray-700/50 rounded flex items-center justify-center text-gray-500 text-xs">
                        Latency Histogram
                      </div>
                      <div className="h-16 bg-gray-700/50 rounded flex items-center justify-center text-gray-500 text-xs">
                        Error Rate
                      </div>
                    </div>
                    <div className="h-20 bg-gray-700/50 rounded flex items-center justify-center text-gray-500 text-sm">
                      Data Volume Trend
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Integration Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">DataDog</span>
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Connected</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">PagerDuty</span>
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Connected</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Slack</span>
                      <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">Configure</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return config.name && config.requirements.businessPurpose
      case 1:
        return config.sources.connections.length > 0
      case 2:
        return config.processing.engine
      case 3:
        return config.orchestration.scheduler && config.orchestration.schedule
      case 4:
        return config.monitoring.metrics.length > 0
      default:
        return false
    }
  }

  const handleDeploy = () => {
    // In a real implementation, this would:
    // 1. Generate all configuration files
    // 2. Create git branch with changes
    // 3. Submit PR for review
    // 4. Trigger CI/CD pipeline
    alert('Pipeline configuration saved! Next steps:\n1. Review generated code in Git\n2. Run tests in staging\n3. Submit for approval\n4. Deploy to production')
    router.push('/build')
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/build')}
                className="flex items-center gap-2 text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back to Pipelines</span>
              </button>
              <div className="h-6 w-px bg-gray-700" />
              <h1 className="text-lg font-semibold text-white">
                {config.name || 'New Pipeline'}
              </h1>
              {params.id !== 'new' && (
                <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
                  Draft
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowToolCoordination(!showToolCoordination)}
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white flex items-center gap-2"
              >
                <Terminal className="h-4 w-4" />
                Tool Coordination
              </button>
              <button className="px-4 py-1.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Draft
              </button>
              {currentStep === STEPS.length - 1 && (
                <button
                  onClick={handleDeploy}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Deploy Pipeline
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="border-b border-gray-800 bg-gray-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <div
                key={step.id}
                className={`flex items-center ${idx < STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <button
                  onClick={() => idx <= currentStep && setCurrentStep(idx)}
                  disabled={idx > currentStep}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    idx === currentStep
                      ? 'bg-blue-600/20 text-blue-400'
                      : idx < currentStep
                      ? 'text-green-400 hover:bg-gray-800'
                      : 'text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    idx === currentStep
                      ? 'border-blue-500 bg-blue-600/20'
                      : idx < currentStep
                      ? 'border-green-500 bg-green-600/20'
                      : 'border-gray-600 bg-gray-800'
                  }`}>
                    {idx < currentStep ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{step.label}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    idx < currentStep ? 'bg-green-600' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>
          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={() => setCurrentStep(prev => Math.min(STEPS.length - 1, prev + 1))}
              disabled={!canProceed()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleDeploy}
              disabled={!canProceed()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Complete Setup
            </button>
          )}
        </div>
      </div>

      {/* Tool Coordination Panel */}
      {showToolCoordination && (
        <div className="fixed bottom-0 right-0 w-96 h-64 bg-gray-850 border-l border-t border-gray-700 rounded-tl-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">Tool Coordination</h3>
            <button
              onClick={() => setShowToolCoordination(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 text-xs font-mono text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Airflow DAG generated</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Spark cluster configuration ready</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">⚠</span>
              <span>DataHub lineage pending registration</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />
              <span>Validating Trino permissions...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}