'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataBrowser } from '@/components/build/DataBrowser';
import { TableDetailPanel } from '@/components/build/TableDetailPanel';
import { CartBottomSheet } from '@/components/build/CartBottomSheet';
import { DataBrowserFilters, type DataFilters } from '@/components/build/DataBrowserFilters';
import { SelectionStatusBar, type StatusBarInsight } from '@/components/build/SelectionStatusBar';
import { useProductCart } from '@/hooks/useProductCart';
import type { NexusTable } from '@/lib/data/build-ecosystem-data';
import { nexusTableToCartTable } from '@/lib/types/product-cart';
import { ArrowRight, ArrowLeft, Database, Package } from 'lucide-react';

export interface Step2Data {
  selectedTables: string[];
}

interface Step2DiscoverProps {
  initialData?: Partial<Step2Data>;
  onComplete: (data: Step2Data) => void;
  onBack: () => void;
}

export function Step2Discover({
  initialData,
  onComplete,
  onBack
}: Step2DiscoverProps) {
  const {
    cart,
    addTable,
    removeTable,
    clearCart,
    isInCart,
    updateCartName,
  } = useProductCart();

  const [selectedTable, setSelectedTable] = useState<NexusTable | null>(null);
  const [cartPanelOpen, setCartPanelOpen] = useState(false);
  const [tablePanelOpen, setTablePanelOpen] = useState(false);
  const [filters, setFilters] = useState<DataFilters>({
    qualityMin: 0,
    freshness: [],
    usageMin: 0,
    domains: [],
    columnSearch: ''
  });
  const [insights, setInsights] = useState<StatusBarInsight[]>([]);

  const handleTableSelect = (table: NexusTable | null) => {
    setSelectedTable(table);
    setTablePanelOpen(table !== null);
  };

  const handleAddToCart = (table: NexusTable) => {
    if (!isInCart(table.id)) {
      const cartTable = nexusTableToCartTable(table, cart.tables.length);
      addTable(table as any);

      // Generate AI insights based on selection
      const newInsights: StatusBarInsight[] = [];

      // Quality warning (if quality < 75)
      if (table.qualityScore < 75) {
        newInsights.push({
          type: 'quality',
          severity: 'warning',
          message: `${table.name} has quality score below 75%`,
          details: 'Consider reviewing data quality metrics before production use',
          dismissible: true
        });
      }

      // Relationship detection (check if commonly joined tables are in cart)
      if (table.usage?.popularJoins && table.usage.popularJoins.length > 0) {
        const joinedTableInCart = table.usage.popularJoins.find(joinName =>
          cart.tables.some(t => t.tableName.toLowerCase().includes(joinName.toLowerCase()))
        );
        if (joinedTableInCart) {
          newInsights.push({
            type: 'relationship',
            severity: 'info',
            message: `${table.name} is often joined with ${joinedTableInCart}`,
            details: 'AI detected common join pattern from usage history',
            dismissible: true
          });
        }
      }

      // Recommendation (if cart has 2+ tables from same domain)
      const sameDomainCount = cart.tables.filter(t =>
        t.domain === table.domain
      ).length;
      if (sameDomainCount >= 1) {
        newInsights.push({
          type: 'recommendation',
          severity: 'info',
          message: `${sameDomainCount + 1} tables selected from ${table.domain} domain`,
          details: 'Consider creating a domain-specific data product',
          dismissible: true
        });
      }

      if (newInsights.length > 0) {
        setInsights(prev => [...prev, ...newInsights].slice(-3)); // Keep max 3 insights
      }
    }
  };

  const handleDismissInsight = (index: number) => {
    setInsights(prev => prev.filter((_, i) => i !== index));
  };

  const isValid = cart.tables.length > 0;

  const handleContinue = () => {
    if (isValid) {
      onComplete({ selectedTables: cart.tables.map(t => t.tableId) });
    }
  };

  return (
    <div className="flex justify-center min-h-screen p-8 transition-all duration-300" style={{
      marginRight: tablePanelOpen ? '60vw' : '0'
    }}>
      <div className="space-y-6 max-w-7xl w-full">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-3xl font-display tracking-tight">Find your data sources</h2>
          <p className="text-muted-foreground text-lg">
            Search and browse available tables. Select the ones that contain the data you need.
          </p>
        </div>

      {/* Selection Status with Cart Button */}
      {cart.tables.length > 0 ? (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">
                {cart.tables.length} table{cart.tables.length !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                We'll automatically figure out what columns you need from these
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
              >
                Clear Selection
              </Button>
              <Button
                onClick={() => setCartPanelOpen(true)}
                size="sm"
              >
                <Package className="w-4 h-4 mr-2" />
                {cart.name || 'View Product'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-muted/30 border border-border rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            No tables selected yet. Browse and add tables below.
          </p>
          <Button
            onClick={() => setCartPanelOpen(true)}
            variant="outline"
            size="sm"
          >
            <Package className="w-4 h-4 mr-2" />
            {cart.name || 'View Product'}
          </Button>
        </div>
      )}

      {/* Filters */}
      <DataBrowserFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableDomains={['Sales', 'Marketing', 'Product', 'Finance']}
      />

      {/* AI Insights Status Bar */}
      {insights.length > 0 && (
        <SelectionStatusBar
          insights={insights}
          onDismiss={handleDismissInsight}
        />
      )}

      {/* Data Browser */}
      <div className="min-h-[500px]">
        <DataBrowser
          onTableSelect={handleTableSelect}
          onAddToCart={handleAddToCart}
          isInCart={isInCart}
        />
      </div>

      {/* Table Detail Panel (Right Side) */}
      <TableDetailPanel
        table={selectedTable}
        isOpen={tablePanelOpen}
        onClose={() => {
          setTablePanelOpen(false);
          setSelectedTable(null);
        }}
        onAddToCart={handleAddToCart}
        isInCart={selectedTable ? isInCart(selectedTable.id) : false}
      />

      {/* Overlay: Cart Bottom Sheet */}
      <CartBottomSheet
        cart={cart}
        isOpen={cartPanelOpen}
        onClose={() => setCartPanelOpen(false)}
        onRemoveTable={removeTable}
        onClearCart={clearCart}
        onUpdateName={updateCartName}
        onTableClick={(tableId) => {
          console.log('Table clicked:', tableId);
        }}
      />

        {/* Navigation */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleContinue}
            disabled={!isValid}
            size="lg"
            className="min-w-[200px]"
          >
            Continue to Schema
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
