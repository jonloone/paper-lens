'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Settings, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThresholdConfig {
  completeness: number;
  uniqueness: number;
  validity: number;
  nullPercentage: number;
}

interface ThresholdConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: ThresholdConfig) => void;
  currentConfig?: ThresholdConfig;
}

export function ThresholdConfigModal({
  open,
  onClose,
  onSave,
  currentConfig = {
    completeness: 95,
    uniqueness: 50,
    validity: 95,
    nullPercentage: 5
  }
}: ThresholdConfigModalProps) {
  const [config, setConfig] = useState<ThresholdConfig>(currentConfig);

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const handleReset = () => {
    setConfig({
      completeness: 95,
      uniqueness: 50,
      validity: 95,
      nullPercentage: 5
    });
  };

  const getStatusColor = (value: number, threshold: number, inverse: boolean = false) => {
    const passes = inverse ? value <= threshold : value >= threshold;
    return passes ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center">
              <Settings className="w-4 h-4 text-primary" />
            </div>
            <div>
              <DialogTitle>Configure Quality Thresholds</DialogTitle>
              <DialogDescription>
                Set minimum thresholds for data quality validation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info Banner */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              Thresholds determine when quality checks pass, warn, or fail. Adjust these based on your data quality requirements.
            </div>
          </div>

          {/* Completeness Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Completeness Threshold</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum percentage of non-null values required
                </p>
              </div>
              <Badge variant="outline" className="text-sm font-mono">
                {config.completeness}%
              </Badge>
            </div>
            <Slider
              value={[config.completeness]}
              onValueChange={(value) => setConfig({ ...config, completeness: value[0] })}
              min={50}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>50% (Lenient)</span>
              <span>100% (Strict)</span>
            </div>
          </div>

          {/* Uniqueness Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Uniqueness Threshold</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum percentage of unique values per column
                </p>
              </div>
              <Badge variant="outline" className="text-sm font-mono">
                {config.uniqueness}%
              </Badge>
            </div>
            <Slider
              value={[config.uniqueness]}
              onValueChange={(value) => setConfig({ ...config, uniqueness: value[0] })}
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>10% (Lenient)</span>
              <span>100% (Strict)</span>
            </div>
          </div>

          {/* Validity Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Validity Threshold</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum percentage of values passing validation rules
                </p>
              </div>
              <Badge variant="outline" className="text-sm font-mono">
                {config.validity}%
              </Badge>
            </div>
            <Slider
              value={[config.validity]}
              onValueChange={(value) => setConfig({ ...config, validity: value[0] })}
              min={50}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>50% (Lenient)</span>
              <span>100% (Strict)</span>
            </div>
          </div>

          {/* Null Percentage Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Maximum Null Percentage</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum allowed percentage of null values
                </p>
              </div>
              <Badge variant="outline" className="text-sm font-mono">
                {config.nullPercentage}%
              </Badge>
            </div>
            <Slider
              value={[config.nullPercentage]}
              onValueChange={(value) => setConfig({ ...config, nullPercentage: value[0] })}
              min={0}
              max={50}
              step={1}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0% (Strict)</span>
              <span>50% (Lenient)</span>
            </div>
          </div>

          {/* Preview Impact */}
          <div className="p-4 rounded-lg border border-border bg-elevation-1">
            <h4 className="text-sm font-semibold mb-3">Threshold Impact Preview</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Completeness ≥ {config.completeness}%</span>
                <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Pass
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Completeness &lt; {config.completeness}% but ≥ 80%</span>
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Warning
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Completeness &lt; 80%</span>
                <Badge variant="secondary" className="bg-red-500/10 text-red-700 dark:text-red-400">
                  Fail
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="mr-auto"
          >
            Reset to Defaults
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary">
            Save Thresholds
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
