import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  HelpCircle,
  Database,
  Key,
  Globe,
  FileText,
  TestTube,
  Sparkles,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfigurationPanelProps {
  nodeId: string;
  nodeType: string;
  nodeName: string;
  currentConfig: any;
  configSchema?: any;
  integrationLevel: 'full' | 'partial' | 'manual';
  onSave: (config: any) => void;
  onClose: () => void;
  className?: string;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  nodeId,
  nodeType,
  nodeName,
  currentConfig = {},
  configSchema,
  integrationLevel,
  onSave,
  onClose,
  className
}) => {
  const [config, setConfig] = useState(currentConfig);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'help'>('basic');

  // Sample configuration schemas for different node types
  const getDefaultSchema = () => {
    if (nodeType === 'database') {
      return {
        basic: [
          { name: 'host', label: 'Host', type: 'text', required: true, placeholder: 'localhost', icon: Globe },
          { name: 'port', label: 'Port', type: 'number', required: true, placeholder: '5432', icon: Globe },
          { name: 'database', label: 'Database', type: 'text', required: true, placeholder: 'mydb', icon: Database },
          { name: 'username', label: 'Username', type: 'text', required: true, placeholder: 'user', icon: Key },
          { name: 'password', label: 'Password', type: 'password', required: true, placeholder: '••••••••', icon: Key }
        ],
        advanced: [
          { name: 'ssl', label: 'Use SSL', type: 'boolean', default: false },
          { name: 'poolSize', label: 'Connection Pool Size', type: 'number', default: 10 },
          { name: 'timeout', label: 'Timeout (ms)', type: 'number', default: 30000 },
          { name: 'retries', label: 'Max Retries', type: 'number', default: 3 }
        ]
      };
    } else if (nodeType === 'file') {
      return {
        basic: [
          { name: 'path', label: 'File Path', type: 'text', required: true, placeholder: 's3://bucket/path', icon: FileText },
          { name: 'format', label: 'Format', type: 'select', required: true, options: ['CSV', 'JSON', 'Parquet', 'Avro'], icon: FileText },
          { name: 'compression', label: 'Compression', type: 'select', options: ['None', 'GZIP', 'Snappy', 'LZ4'], icon: FileText }
        ],
        advanced: [
          { name: 'delimiter', label: 'Delimiter', type: 'text', default: ',' },
          { name: 'header', label: 'Has Header', type: 'boolean', default: true },
          { name: 'encoding', label: 'Encoding', type: 'select', options: ['UTF-8', 'ASCII', 'ISO-8859-1'], default: 'UTF-8' }
        ]
      };
    } else if (nodeType === 'streaming') {
      return {
        basic: [
          { name: 'brokers', label: 'Broker URLs', type: 'text', required: true, placeholder: 'localhost:9092', icon: Globe },
          { name: 'topic', label: 'Topic', type: 'text', required: true, placeholder: 'my-topic', icon: FileText },
          { name: 'groupId', label: 'Consumer Group', type: 'text', placeholder: 'consumer-group', icon: FileText }
        ],
        advanced: [
          { name: 'autoCommit', label: 'Auto Commit', type: 'boolean', default: true },
          { name: 'batchSize', label: 'Batch Size', type: 'number', default: 100 },
          { name: 'maxPollRecords', label: 'Max Poll Records', type: 'number', default: 500 }
        ]
      };
    } else {
      return {
        basic: [
          { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Component name', icon: FileText },
          { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe this component...', icon: FileText }
        ],
        advanced: []
      };
    }
  };

  const schema = configSchema || getDefaultSchema();

  const handleInputChange = (field: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateConfig = () => {
    const errors: Record<string, string> = {};
    
    // Validate required fields
    [...schema.basic, ...schema.advanced].forEach((field: any) => {
      if (field.required && !config[field.name]) {
        errors[field.name] = `${field.label} is required`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTest = async () => {
    if (!validateConfig()) return;

    setTestStatus('testing');
    
    // Simulate test connection
    setTimeout(() => {
      const success = Math.random() > 0.3;
      setTestStatus(success ? 'success' : 'error');
      
      if (!success) {
        setValidationErrors({
          connection: 'Failed to connect. Please check your configuration.'
        });
      }
    }, 2000);
  };

  const handleSave = () => {
    if (!validateConfig()) return;
    onSave(config);
  };

  const renderField = (field: any) => {
    const Icon = field.icon || Settings;
    const hasError = !!validationErrors[field.name];

    return (
      <div key={field.name} className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Icon className="w-4 h-4 text-muted-foreground" />
          {field.label}
          {field.required && <span className="text-red-500">*</span>}
          {field.help && (
            <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" title={field.help} />
          )}
        </label>
        
        {field.type === 'text' || field.type === 'password' || field.type === 'number' ? (
          <input
            type={field.type}
            value={config[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
            placeholder={field.placeholder}
            className={cn(
              "w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2",
              hasError ? "border-red-500 focus:ring-red-500" : "focus:ring-primary"
            )}
          />
        ) : field.type === 'textarea' ? (
          <textarea
            value={config[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={cn(
              "w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2",
              hasError ? "border-red-500 focus:ring-red-500" : "focus:ring-primary"
            )}
          />
        ) : field.type === 'select' ? (
          <select
            value={config[field.name] || field.default || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={cn(
              "w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2",
              hasError ? "border-red-500 focus:ring-red-500" : "focus:ring-primary"
            )}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : field.type === 'boolean' ? (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config[field.name] || field.default || false}
              onChange={(e) => handleInputChange(field.name, e.target.checked)}
              className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">Enable {field.label}</span>
          </label>
        ) : null}
        
        {hasError && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {validationErrors[field.name]}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={cn("w-96 h-full bg-card border-l flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">Configure {nodeName}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Integration Status */}
        <div className="flex items-center gap-2 text-sm">
          {integrationLevel === 'full' ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-600">Full API Integration</span>
            </>
          ) : integrationLevel === 'partial' ? (
            <>
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-600">Partial Integration - Some manual steps required</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-orange-600">Manual Configuration Required</span>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('basic')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              activeTab === 'basic' 
                ? "bg-primary text-primary-foreground" 
                : "bg-background hover:bg-muted"
            )}
          >
            Basic
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              activeTab === 'advanced' 
                ? "bg-primary text-primary-foreground" 
                : "bg-background hover:bg-muted"
            )}
          >
            Advanced
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              activeTab === 'help' 
                ? "bg-primary text-primary-foreground" 
                : "bg-background hover:bg-muted"
            )}
          >
            Help
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'basic' && (
          <div className="space-y-4">
            {schema.basic.map(renderField)}
            
            {/* Best Practice Suggestions */}
            {integrationLevel === 'full' && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-600">Best Practice</p>
                    <p className="text-xs text-muted-foreground">
                      Use environment variables for sensitive information like passwords.
                      This configuration will be automatically encrypted when saved.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-4">
            {schema.advanced.length > 0 ? (
              schema.advanced.map(renderField)
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No advanced configuration options available for this component.
              </p>
            )}
          </div>
        )}

        {activeTab === 'help' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Quick Start</h4>
                <p className="text-sm text-muted-foreground">
                  Fill in the required fields marked with a red asterisk (*) to get started quickly.
                  You can always come back to configure advanced options later.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Connection Testing</h4>
                <p className="text-sm text-muted-foreground">
                  Use the "Test Connection" button to verify your configuration before saving.
                  This helps catch configuration errors early.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Documentation</h4>
                <div className="space-y-2">
                  <a href="#" className="text-sm text-primary hover:underline block">
                    → Component Documentation
                  </a>
                  <a href="#" className="text-sm text-primary hover:underline block">
                    → Configuration Examples
                  </a>
                  <a href="#" className="text-sm text-primary hover:underline block">
                    → Troubleshooting Guide
                  </a>
                </div>
              </div>

              {integrationLevel === 'manual' && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-md">
                  <h4 className="font-medium mb-2 text-orange-600">Manual Setup Required</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    This component requires manual configuration outside of this interface:
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Export the configuration using the button below</li>
                    <li>Apply the configuration to your {nodeName} instance</li>
                    <li>Verify the connection manually</li>
                    <li>Update the status here once configured</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t space-y-3">
        {/* Test Connection Button */}
        {integrationLevel !== 'manual' && (
          <button
            onClick={handleTest}
            disabled={testStatus === 'testing'}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors",
              testStatus === 'testing' && "bg-muted text-muted-foreground cursor-wait",
              testStatus === 'success' && "bg-green-500/10 text-green-600 border border-green-500/20",
              testStatus === 'error' && "bg-red-500/10 text-red-600 border border-red-500/20",
              testStatus === 'idle' && "bg-background border hover:bg-muted"
            )}
          >
            {testStatus === 'testing' ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Testing Connection...
              </>
            ) : testStatus === 'success' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Connection Successful
              </>
            ) : testStatus === 'error' ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Connection Failed
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4" />
                Test Connection
              </>
            )}
          </button>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-background border rounded-md hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Save Configuration
          </button>
        </div>

        {/* Validation Summary */}
        {Object.keys(validationErrors).length > 0 && validationErrors.connection && (
          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-xs text-red-600">{validationErrors.connection}</p>
          </div>
        )}
      </div>
    </div>
  );
};