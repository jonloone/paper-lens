import React, { useState, useEffect } from 'react';
import { X, Save, TestTube, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { NodeTypeDefinition } from '@/lib/services/NodeTypeRegistry';
import { useMCPConnection } from '@/hooks/useMCPConnection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ConfigurationModalProps {
  nodeId: string;
  definition: NodeTypeDefinition;
  currentConfig: any;
  onSave: (config: any) => void;
  onClose: () => void;
}

export const ConfigurationModal: React.FC<ConfigurationModalProps> = ({
  nodeId,
  definition,
  currentConfig,
  onSave,
  onClose
}) => {
  const [config, setConfig] = useState(currentConfig || {});
  const [isValidating, setIsValidating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const { sendMCPRequest } = useMCPConnection(definition.mcpServer);
  
  // Initialize config with defaults from schema
  useEffect(() => {
    if (!currentConfig && definition.configSchema?.properties) {
      const defaults: any = {};
      Object.entries(definition.configSchema.properties).forEach(([key, prop]: [string, any]) => {
        if (prop.default !== undefined) {
          defaults[key] = prop.default;
        }
      });
      setConfig(defaults);
    }
  }, [currentConfig, definition.configSchema]);
  
  const handleValidate = async () => {
    setIsValidating(true);
    setValidationResult(null);
    try {
      const result = await sendMCPRequest('validateConfig', {
        nodeType: definition.type,
        config
      });
      setValidationResult(result);
    } catch (error: any) {
      setValidationResult({ 
        valid: false, 
        errors: [error.message || 'Validation failed'] 
      });
    } finally {
      setIsValidating(false);
    }
  };
  
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await sendMCPRequest('testConnection', {
        nodeType: definition.type,
        config
      });
      setTestResult(result);
    } catch (error: any) {
      setTestResult({ 
        success: false, 
        error: error.message || 'Connection test failed' 
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  const handleSave = () => {
    onSave(config);
  };
  
  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [key]: value
    }));
    // Clear validation when config changes
    setValidationResult(null);
    setTestResult(null);
  };
  
  const renderField = (key: string, schema: any) => {
    const value = config[key];
    const isRequired = definition.configSchema?.required?.includes(key);
    
    // Render based on schema type
    if (schema.enum) {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>
            {schema.title || key}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Select value={value || ''} onValueChange={(v) => updateConfig(key, v)}>
            <SelectTrigger id={key}>
              <SelectValue placeholder={`Select ${schema.title || key}`} />
            </SelectTrigger>
            <SelectContent>
              {schema.enum.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {schema.description && (
            <p className="text-xs text-muted-foreground">{schema.description}</p>
          )}
        </div>
      );
    }
    
    if (schema.type === 'boolean') {
      return (
        <div key={key} className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor={key}>
              {schema.title || key}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {schema.description && (
              <p className="text-xs text-muted-foreground">{schema.description}</p>
            )}
          </div>
          <Switch
            id={key}
            checked={value || false}
            onCheckedChange={(checked) => updateConfig(key, checked)}
          />
        </div>
      );
    }
    
    if (schema.type === 'number') {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>
            {schema.title || key}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id={key}
            type="number"
            value={value || ''}
            onChange={(e) => updateConfig(key, e.target.value ? Number(e.target.value) : null)}
            placeholder={schema.placeholder || `Enter ${schema.title || key}`}
            min={schema.minimum}
            max={schema.maximum}
          />
          {schema.description && (
            <p className="text-xs text-muted-foreground">{schema.description}</p>
          )}
        </div>
      );
    }
    
    if (schema.type === 'object') {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>
            {schema.title || key}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Textarea
            id={key}
            value={value ? JSON.stringify(value, null, 2) : ''}
            onChange={(e) => {
              try {
                updateConfig(key, JSON.parse(e.target.value));
              } catch {
                // Invalid JSON, keep as string for now
              }
            }}
            placeholder={`Enter JSON for ${schema.title || key}`}
            className="font-mono text-xs"
            rows={4}
          />
          {schema.description && (
            <p className="text-xs text-muted-foreground">{schema.description}</p>
          )}
        </div>
      );
    }
    
    // Default to text input
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key}>
          {schema.title || key}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {schema.type === 'string' && key.toLowerCase().includes('query') || key.toLowerCase().includes('sql') ? (
          <Textarea
            id={key}
            value={value || ''}
            onChange={(e) => updateConfig(key, e.target.value)}
            placeholder={schema.placeholder || `Enter ${schema.title || key}`}
            className="font-mono text-xs"
            rows={6}
          />
        ) : (
          <Input
            id={key}
            type={schema.format === 'password' ? 'password' : 'text'}
            value={value || ''}
            onChange={(e) => updateConfig(key, e.target.value)}
            placeholder={schema.placeholder || `Enter ${schema.title || key}`}
          />
        )}
        {schema.description && (
          <p className="text-xs text-muted-foreground">{schema.description}</p>
        )}
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-xl">{definition.icon}</span>
              Configure {definition.label}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {definition.category.toUpperCase()} • {definition.type}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {definition.configSchema?.properties ? (
            <div className="space-y-4">
              {Object.entries(definition.configSchema.properties).map(([key, schema]: [string, any]) =>
                renderField(key, schema)
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No configuration required for this component</p>
            </div>
          )}
          
          {/* Validation Results */}
          {validationResult && (
            <Alert className={cn(
              "mt-4",
              validationResult.valid ? "border-green-500" : "border-red-500"
            )}>
              {validationResult.valid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription>
                {validationResult.valid ? (
                  'Configuration is valid'
                ) : (
                  <div>
                    <div className="font-semibold mb-1">Validation errors:</div>
                    {validationResult.errors?.map((error: string, idx: number) => (
                      <div key={idx} className="text-sm">• {error}</div>
                    ))}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Test Results */}
          {testResult && (
            <Alert className={cn(
              "mt-4",
              testResult.success ? "border-green-500" : "border-red-500"
            )}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription>
                {testResult.success ? (
                  testResult.message || 'Connection test successful'
                ) : (
                  `Connection test failed: ${testResult.error}`
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/50">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleValidate}
              disabled={isValidating}
            >
              {isValidating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                'Validate'
              )}
            </Button>
            
            <Button
              size="sm"
              onClick={handleSave}
              disabled={validationResult && !validationResult.valid}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};