# Table Browser Redesign - Phase 1 Status

## Session Summary

### Completed Work

1. **✅ Critical Analysis Document Created**
   - Location: `/docs/TABLE_BROWSER_REDESIGN.md`
   - Comprehensive UX analysis from persona perspective
   - Master-detail pattern design specification
   - Phased implementation roadmap

2. **✅ Source Connection Flow Restructured**
   - Removed redundant ingestion method selection from Step 2
   - Changed flow from: Category → Method → Connect
   - To new flow: Category → Connector → Connect & Browse → Configure Ingestion
   - Files modified:
     - `/app/(main)/manage/sources/new/page.tsx`
     - `/app/(main)/manage/sources/new/connect/page.tsx`

3. **✅ Code Preparation**
   - Added state management for inspected table
   - Added handlers for inspect vs. select behavior
   - Imported Tabs component and additional icons
   - Created backup of TableBrowserStep.tsx

### In Progress

**Phase 1 MVP Implementation** (Currently Working)

The master-detail layout redesign is partially complete. Current state:
- State variables added for `inspectedTable` and `sampleData`
- Handlers created: `handleInspectTable()`, `handleCloseDetail()`, `handleToggleTable()` (simplified)
- Component structure needs complete rewrite for two-panel layout

### Remaining Tasks for Phase 1

#### High Priority (Blocking)
1. **Restructure Main Component Layout**
   - Replace single-column list with two-panel grid
   - Left panel (40%): Compact table cards
   - Right panel (60%): Detail panel with tabs

2. **Build Table List Panel (Left)**
   - Remove ingestion method dropdowns
   - Add status badges (✓ Clean, ⚠ Issues, 🔄 Updated, 🔒 PII)
   - Make rows clickable to inspect (not just checkbox)
   - Highlight inspected table
   - Keep checkbox for selection

3. **Build Table Detail Panel (Right)**
   - Show placeholder when no table inspected
   - Display table name and close button [×]
   - Implement tabs structure

4. **Implement Overview Tab**
   - Display table metadata:
     - Row count, size, column count
     - Primary keys
     - Last updated timestamp
     - Update frequency indicator
   - Show data quality score placeholder
   - Display PII detection warnings

5. **Implement Schema Tab**
   - Column list table with:
     - Column name
     - Data type
     - Null percentage
     - Sample distinct values (3-5 examples)
   - Add icons for primary keys (🔑) and PII (🔒)
   - Show null % warnings for high values

6. **Implement Sample Data Tab**
   - Display mock sample data (first 100 rows)
   - Scrollable table view
   - Show "In production, this would query: SELECT * FROM {schema}.{table} LIMIT 100"

#### Medium Priority (Polish)
7. **Add Status Badges to Table List**
   - Calculate quality score from mockTables data
   - Show appropriate badge based on:
     - ✓ Clean: >90% complete
     - ⚠ Issues: 70-90% complete
     - 🔄 Updated: lastUpdated < 24 hours
     - 🔒 PII: has sensitive columns

8. **Add Animations**
   - Detail panel slide-in effect
   - Smooth transitions when switching inspected table
   - Loading states for tabs

9. **Selection Summary Update**
   - Remove method grouping (moved to Step 3)
   - Keep simple count: "5 tables selected"
   - Move to top of left panel

#### Nice to Have (Future)
10. **Responsive Design**
    - Stack panels vertically on mobile
    - Make detail panel a modal on small screens

11. **Keyboard Navigation**
    - Arrow keys to navigate table list
    - Enter to inspect, Space to select
    - Esc to close detail panel

---

## Implementation Code Snippets

### Main Layout Structure (Needed)

```tsx
return (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Table2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Browse & Explore Tables</h2>
          <p className="text-muted-foreground">
            Click a table to explore, check to select
          </p>
        </div>
      </div>

      {/* Selection count */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <span className="font-medium">{selectedCount} selected</span>
        </div>
      )}
    </div>

    {/* Master-Detail Grid */}
    <div className="grid grid-cols-12 gap-6 min-h-[600px]">
      {/* LEFT PANEL: Table List (Master) */}
      <div className="col-span-5 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedSchema} onValueChange={setSelectedSchema}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {schemas.map(schema => (
                <SelectItem key={schema} value={schema}>
                  {schema === 'all' ? 'All' : schema}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table Cards */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {filteredTables.map((table) => {
            const key = `${table.schema}.${table.name}`;
            const isSelected = selectedTables.has(key);
            const isInspected = inspectedTable?.name === table.name;

            return (
              <Card
                key={key}
                className={`cursor-pointer transition-all ${
                  isInspected
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => handleInspectTable(table)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleTable(table)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* Table info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{table.name}</p>
                        {/* Status badges */}
                        {table.hasTimestampColumn && (
                          <RefreshCw className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{table.schema}</span>
                        <span>•</span>
                        <span>{table.rowCount.toLocaleString()} rows</span>
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="text-right text-xs">
                      <div className="text-muted-foreground">
                        {table.sizeMB < 1
                          ? `${(table.sizeMB * 1024).toFixed(0)} KB`
                          : `${table.sizeMB} MB`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL: Table Detail (Detail) */}
      <div className="col-span-7">
        {!inspectedTable ? (
          /* Placeholder */
          <Card className="h-full flex items-center justify-center border-dashed">
            <div className="text-center text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Click a table to explore</p>
            </div>
          </Card>
        ) : (
          /* Detail Panel */
          <Card className="h-full">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {inspectedTable.schema}.{inspectedTable.name}
                  </CardTitle>
                  <CardDescription>
                    {inspectedTable.rowCount.toLocaleString()} rows • {inspectedTable.sizeMB} MB • {inspectedTable.columns} columns
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseDetail}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="schema">Schema</TabsTrigger>
                  <TabsTrigger value="sample">Sample Data</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Primary Keys</p>
                      <p className="font-mono text-sm">{inspectedTable.primaryKeys.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="text-sm">{inspectedTable.lastUpdated || 'Unknown'}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Recommendation</p>
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{methodLabels[inspectedTable.recommendedMethod]}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {inspectedTable.recommendationReason[0]}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Schema Tab */}
                <TabsContent value="schema" className="mt-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    Column information coming from schema introspection
                  </div>
                  <div className="space-y-2 text-sm">
                    {inspectedTable.primaryKeys.map((col) => (
                      <div key={col} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                        <div className="font-mono">{col}</div>
                        <Badge variant="outline" className="text-xs">PRIMARY KEY</Badge>
                      </div>
                    ))}
                    {inspectedTable.hasTimestampColumn && (
                      <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                        <div className="font-mono">{inspectedTable.timestampColumnName}</div>
                        <Badge variant="outline" className="text-xs">TIMESTAMP</Badge>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground pt-2">
                      + {inspectedTable.columns - inspectedTable.primaryKeys.length - (inspectedTable.hasTimestampColumn ? 1 : 0)} more columns
                    </div>
                  </div>
                </TabsContent>

                {/* Sample Data Tab */}
                <TabsContent value="sample" className="mt-4">
                  <div className="text-xs text-muted-foreground mb-4 font-mono">
                    SELECT * FROM {inspectedTable.schema}.{inspectedTable.name} LIMIT 100
                  </div>
                  {sampleData.length > 0 ? (
                    <div className="border rounded overflow-auto max-h-96">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(sampleData[0]).map((col) => (
                              <TableHead key={col} className="font-mono text-xs">
                                {col}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sampleData.map((row, idx) => (
                            <TableRow key={idx}>
                              {Object.values(row).map((val: any, i) => (
                                <TableCell key={i} className="font-mono text-xs">
                                  {String(val)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No sample data loaded
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>

    {/* Navigation */}
    <div className="flex items-center justify-between pt-6 border-t">
      <Button variant="outline" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Button
        onClick={handleContinue}
        disabled={selectedCount === 0}
        size="lg"
        className="gap-2"
      >
        Continue with {selectedCount} table{selectedCount !== 1 ? 's' : ''}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  </div>
);
```

---

## Next Steps

1. **Complete the layout restructure** using the code snippet above
2. **Test the master-detail interaction**:
   - Click table → detail panel opens
   - Switch tabs → content changes
   - Close detail → panel closes
   - Checkbox → selects independently of inspect
3. **Add status badges** to table cards
4. **Improve Schema tab** with actual column data
5. **Polish animations** and transitions

## Testing Checklist

- [ ] Can click table to inspect without selecting
- [ ] Can check checkbox to select without inspecting
- [ ] Detail panel shows correct table
- [ ] Can switch between Overview, Schema, Sample tabs
- [ ] Can close detail panel with [×] button
- [ ] Sample data displays in table format
- [ ] Can select multiple tables while inspecting one
- [ ] Continue button shows correct count
- [ ] Search and schema filter work with new layout

---

## Files Modified This Session

1. `/docs/TABLE_BROWSER_REDESIGN.md` - Complete UX analysis and design spec
2. `/docs/TABLE_BROWSER_PHASE1_STATUS.md` - This status document
3. `/app/(main)/manage/sources/new/page.tsx` - Removed step 2, added connector selection
4. `/app/(main)/manage/sources/new/connect/page.tsx` - Updated parameters
5. `/components/build/connection-flow/TableBrowserStep.tsx` - Partially updated (needs completion)
6. `/components/build/connection-flow/TableBrowserStep.tsx.backup` - Backup of original

---

## Estimated Completion Time

**Remaining work**: 2-3 hours for one developer to complete Phase 1 MVP

**Breakdown**:
- Layout restructure: 1 hour
- Tab content polish: 30 minutes
- Status badges: 30 minutes
- Testing and bug fixes: 30-60 minutes
