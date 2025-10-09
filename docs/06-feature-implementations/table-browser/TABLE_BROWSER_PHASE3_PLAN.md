# Table Browser Phase 3 - Advanced Features & Integration

## Overview

Phase 3 adds advanced data intelligence features to transform the table browser into a comprehensive data discovery and assessment platform. This phase focuses on lineage visualization, PII detection, column-level profiling, and real backend integration.

---

## Phase 3 Goals

### Primary Objectives
1. **Data Lineage Visualization** - Show upstream/downstream dependencies
2. **PII Detection & Compliance** - Identify sensitive data automatically
3. **Column-Level Profiling** - Drill into individual column statistics
4. **Real Backend Integration** - Connect to actual profiling APIs
5. **Data Export** - Allow users to export samples and reports

### Success Metrics
- Users can trace data lineage end-to-end
- PII columns automatically flagged with compliance warnings
- Column-level stats available on-demand
- Profile data loads from real backend in <3 seconds
- Export functionality used by 60%+ of users

---

## Feature Breakdown

### Feature 1: Data Lineage Tab ⭐ (High Priority)

**Purpose**: Help users understand table dependencies and impact

**UI Design**:
```
┌─────────────────────────────────────────────────────────────┐
│ Lineage                                                      │
│                                                              │
│ ┌──────────────────┐                                        │
│ │ Upstream Sources │                                        │
│ └──────────────────┘                                        │
│                                                              │
│  📊 raw_orders (Kafka Topic)                                │
│     └─ Last updated: 2 minutes ago                         │
│     └─ ~1.2M events/day                                    │
│                                                              │
│  🔄 customer_enrichment (dbt Model)                         │
│     └─ Adds: country, segment, lifetime_value              │
│     └─ Runs: Daily at 2 AM                                 │
│                                                              │
│ ┌────────────────────┐                                      │
│ │ Downstream Usage   │                                      │
│ └────────────────────┘                                      │
│                                                              │
│  📈 revenue_dashboard (Tableau)                             │
│     └─ Used by: Finance team (15 users)                    │
│     └─ Refreshes: Every 15 minutes                         │
│                                                              │
│  🤖 ml_training_dataset (S3)                                │
│     └─ ML Model: customer_churn_predictor                  │
│     └─ Last training: 2 days ago                           │
│                                                              │
│  📧 daily_sales_report (Airflow DAG)                        │
│     └─ Recipients: sales@company.com                       │
│     └─ Schedule: Daily 8 AM                                │
│                                                              │
│ 💡 Impact: Changing this table affects 3 downstream systems│
└─────────────────────────────────────────────────────────────┘
```

**Implementation**:
- New tab: `<TabsTrigger value="lineage">Lineage</TabsTrigger>`
- State: `const [lineageData, setLineageData] = useState<any>(null)`
- Mock data structure:
```typescript
{
  upstream: [
    {
      name: 'raw_orders',
      type: 'kafka_topic',
      lastUpdated: '2 minutes ago',
      throughput: '1.2M events/day'
    },
    {
      name: 'customer_enrichment',
      type: 'dbt_model',
      adds: ['country', 'segment', 'lifetime_value'],
      schedule: 'Daily at 2 AM'
    }
  ],
  downstream: [
    {
      name: 'revenue_dashboard',
      type: 'tableau',
      users: 15,
      team: 'Finance',
      refresh: 'Every 15 minutes'
    },
    {
      name: 'ml_training_dataset',
      type: 's3',
      model: 'customer_churn_predictor',
      lastTraining: '2 days ago'
    },
    {
      name: 'daily_sales_report',
      type: 'airflow_dag',
      recipients: 'sales@company.com',
      schedule: 'Daily 8 AM'
    }
  ],
  impactScore: 'HIGH', // LOW, MEDIUM, HIGH
  affectedSystems: 3
}
```

**Icons Needed**:
- `GitBranch` - For lineage connections
- `ArrowDown` - Downstream
- `ArrowUp` - Upstream
- `AlertTriangle` - High impact warning

---

### Feature 2: PII Detection in Schema Tab ⭐ (High Priority)

**Purpose**: Automatically identify and flag sensitive data columns

**Visual Enhancement**:
```
Schema Tab with PII Detection:

┌──────────────┬─────────────────┬──────────┬──────────┬────────┬─────────────────────┐
│ Column       │ Type            │ Nullable │ Distinct │ Null % │ PII Detection       │
├──────────────┼─────────────────┼──────────┼──────────┼────────┼─────────────────────┤
│ id [PK]      │ INTEGER         │ NO       │ 50,000   │ 0.0%   │ ✓ Safe              │
│ email        │ VARCHAR(255)    │ YES      │ 49,000   │ 5.2%   │ 🔒 PII: Email       │ ← Red badge
│ ssn          │ VARCHAR(11)     │ YES      │ 50,000   │ 0.1%   │ 🔒 PII: SSN         │ ← Red badge
│ first_name   │ VARCHAR(100)    │ YES      │ 15,000   │ 2.0%   │ 🔒 PII: Name        │ ← Red badge
│ ip_address   │ VARCHAR(45)     │ YES      │ 48,000   │ 3.0%   │ 🔒 PII: IP Address  │ ← Red badge
│ amount       │ DECIMAL(10,2)   │ YES      │ 35,000   │ 1.2%   │ ✓ Safe              │
└──────────────┴─────────────────┴──────────┴──────────┴────────┴─────────────────────┘

⚠️ WARNING: 4 columns contain PII. Ensure proper masking and access controls.
```

**PII Detection Logic**:
```typescript
const detectPII = (columnName: string, dataType: string, sampleValues: any[]): {
  isPII: boolean;
  type: string | null;
  severity: 'high' | 'medium' | 'low';
} => {
  const lowerName = columnName.toLowerCase();

  // High severity PII
  if (lowerName.includes('ssn') || lowerName.includes('social_security')) {
    return { isPII: true, type: 'SSN', severity: 'high' };
  }
  if (lowerName.includes('credit_card') || lowerName.includes('card_number')) {
    return { isPII: true, type: 'Credit Card', severity: 'high' };
  }

  // Medium severity PII
  if (lowerName.includes('email')) {
    return { isPII: true, type: 'Email', severity: 'medium' };
  }
  if (lowerName.includes('phone') || lowerName.includes('mobile')) {
    return { isPII: true, type: 'Phone', severity: 'medium' };
  }
  if (lowerName.includes('first_name') || lowerName.includes('last_name') || lowerName === 'name') {
    return { isPII: true, type: 'Name', severity: 'medium' };
  }
  if (lowerName.includes('address') || lowerName.includes('street') || lowerName.includes('zip')) {
    return { isPII: true, type: 'Address', severity: 'medium' };
  }
  if (lowerName.includes('ip_address') || lowerName === 'ip') {
    return { isPII: true, type: 'IP Address', severity: 'medium' };
  }

  // Low severity (quasi-identifiers)
  if (lowerName.includes('date_of_birth') || lowerName.includes('dob') || lowerName.includes('birth_date')) {
    return { isPII: true, type: 'Date of Birth', severity: 'low' };
  }

  // Pattern-based detection from sample values
  if (sampleValues.some(val => {
    if (typeof val !== 'string') return false;
    // Email pattern
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return true;
    // Phone pattern
    if (/^\+?1?\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(val)) return true;
    // SSN pattern
    if (/^\d{3}-?\d{2}-?\d{4}$/.test(val)) return true;
    return false;
  })) {
    return { isPII: true, type: 'Detected from pattern', severity: 'medium' };
  }

  return { isPII: false, type: null, severity: 'low' };
};
```

**Visual Treatment**:
- **High severity**: Red badge `🔒 PII: SSN`
- **Medium severity**: Orange badge `🔒 PII: Email`
- **Low severity**: Yellow badge `⚠️ PII: DOB`
- **Safe**: Green checkmark `✓ Safe`

**Compliance Warning**:
```typescript
const piiColumns = schemaData.filter(col => col.piiDetection?.isPII);

{piiColumns.length > 0 && (
  <Alert variant="destructive" className="mt-4">
    <ShieldAlert className="h-4 w-4" />
    <AlertTitle>PII Detected</AlertTitle>
    <AlertDescription>
      {piiColumns.length} column{piiColumns.length > 1 ? 's' : ''} contain personally identifiable information.
      Ensure proper data masking, encryption, and access controls are in place.
      <ul className="mt-2 list-disc list-inside">
        {piiColumns.map(col => (
          <li key={col.name}><strong>{col.name}</strong>: {col.piiDetection.type}</li>
        ))}
      </ul>
    </AlertDescription>
  </Alert>
)}
```

---

### Feature 3: Column-Level Profiling Drill-Down ⭐

**Purpose**: Allow deep dive into individual column statistics

**Interaction**: Click column name in Schema tab → Opens column detail modal

**Modal Content**:
```
┌─────────────────────────────────────────────────────────────┐
│ Column Details: email                                    [×] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Basic Information                                            │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Type: VARCHAR(255)              Nullable: YES        │   │
│ │ Distinct: 49,000 (98%)          Missing: 5.2%        │   │
│ │ PII: 🔒 Email Address (Medium Severity)              │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Distribution                                                 │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ▂▃▅▇█▇▅▃▂  (Frequency histogram)                     │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Top Values                                                   │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ john.doe@company.com        1,234 occurrences (2.5%) │   │
│ │ jane.smith@company.com      987 occurrences (2.0%)   │   │
│ │ bob@company.com             856 occurrences (1.7%)   │   │
│ │ [null]                      2,600 occurrences (5.2%) │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Quality Issues                                               │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ⚠️ High null percentage (5.2%)                        │   │
│ │ 💡 Consider: Email validation, required field        │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Sample Values (10 random)                                    │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ john.doe@company.com, jane@example.com, null,        │   │
│ │ bob.johnson@corp.com, alice@startup.io, ...          │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│                                    [Export CSV] [Close]      │
└─────────────────────────────────────────────────────────────┘
```

**Implementation**:
```typescript
const [selectedColumn, setSelectedColumn] = useState<any>(null);

// In Schema tab, make column names clickable
<TableCell
  className="font-mono text-sm font-medium cursor-pointer hover:text-primary"
  onClick={() => setSelectedColumn(col)}
>
  {col.name}
</TableCell>

// Column detail modal
{selectedColumn && (
  <Dialog open={!!selectedColumn} onOpenChange={() => setSelectedColumn(null)}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Column Details: {selectedColumn.name}</DialogTitle>
      </DialogHeader>
      {/* Content as shown above */}
    </DialogContent>
  </Dialog>
)}
```

---

### Feature 4: Data Export Functionality ⭐

**Purpose**: Allow users to export sample data and profiling reports

**Export Options**:
1. **Sample Data** → CSV/JSON
2. **Profiling Report** → PDF/JSON
3. **Schema Definition** → SQL DDL/JSON

**UI Implementation**:
```typescript
// Add export button to Sample Data tab
<div className="flex items-center justify-between mb-4">
  <Badge variant="outline">{sampleData.length} rows</Badge>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onClick={() => exportToCSV(sampleData)}>
        Export as CSV
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => exportToJSON(sampleData)}>
        Export as JSON
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>

// Export functions
const exportToCSV = (data: any[]) => {
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => JSON.stringify(row[h])).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${inspectedTable.schema}.${inspectedTable.name}_sample.csv`;
  a.click();
};

const exportToJSON = (data: any[]) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${inspectedTable.schema}.${inspectedTable.name}_sample.json`;
  a.click();
};
```

**Add to Profile tab**:
```typescript
<Button variant="outline" size="sm" onClick={() => exportProfileReport(profileData)}>
  <FileDown className="h-4 w-4 mr-2" />
  Export Report
</Button>
```

---

### Feature 5: Real Backend Integration ⭐ (Critical)

**Purpose**: Connect Profile tab to actual profiling API

**Current State**: Mock data with setTimeout
**Target State**: Real API calls with error handling

**Implementation**:
```typescript
const handleRunProfile = async () => {
  if (!inspectedTable || !connection) return;

  setLoadingProfile(true);

  try {
    const response = await fetch('http://localhost:8000/api/v1/sources/tables/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connection_type: connection.type,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        schema: inspectedTable.schema,
        table: inspectedTable.name,
        username: connection.username,
        password: connection.password,
        sample_limit: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Profiling failed: ${response.statusText}`);
    }

    const data = await response.json();
    setProfileData(data);

    // Cache the result
    localStorage.setItem(
      `profile_${inspectedTable.schema}.${inspectedTable.name}`,
      JSON.stringify({ data, timestamp: Date.now() })
    );

  } catch (error) {
    console.error('Profiling error:', error);
    toast({
      variant: "destructive",
      title: "Profiling Failed",
      description: error instanceof Error ? error.message : "An unknown error occurred",
    });
  } finally {
    setLoadingProfile(false);
  }
};

// Check cache first
useEffect(() => {
  if (inspectedTable) {
    const cacheKey = `profile_${inspectedTable.schema}.${inspectedTable.name}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Use cache if less than 1 hour old
      if (Date.now() - timestamp < 3600000) {
        setProfileData(data);
      }
    }
  }
}, [inspectedTable]);
```

**Error Handling States**:
```typescript
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Profiling Failed</AlertTitle>
    <AlertDescription>
      {error.message}
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={handleRunProfile}
      >
        Retry
      </Button>
    </AlertDescription>
  </Alert>
)}
```

---

## Implementation Priority

### Week 1: Foundation
- [x] Phase 3 planning ← **You are here**
- [ ] Add Lineage tab structure
- [ ] Implement PII detection logic
- [ ] Add column drill-down modal

### Week 2: Integration
- [ ] Connect to real profiling API
- [ ] Implement caching strategy
- [ ] Add error handling and retry logic
- [ ] Test with real database connections

### Week 3: Enhancement
- [ ] Add data export functionality
- [ ] Implement lineage visualization
- [ ] Add column-level profiling
- [ ] Performance optimization

### Week 4: Polish
- [ ] UX refinements
- [ ] Documentation
- [ ] Testing and bug fixes
- [ ] User feedback integration

---

## Technical Requirements

### New Dependencies
```json
{
  "recharts": "^2.10.0",  // For column distribution charts
  "react-flow-renderer": "^10.3.17"  // For lineage graphs (future)
}
```

### New Icons (Lucide)
```typescript
import {
  GitBranch,      // Lineage
  ArrowUp,        // Upstream
  ArrowDown,      // Downstream
  Download,       // Export
  FileDown,       // Export file
  Shield,         // PII/Security
  ShieldAlert,    // PII warning
  TrendingUp,     // Distribution chart
  BarChart,       // Column stats
} from 'lucide-react';
```

### API Endpoints Needed
- `POST /api/v1/sources/tables/lineage` - Get table lineage
- `POST /api/v1/sources/tables/pii-scan` - PII detection
- `POST /api/v1/sources/tables/column-profile` - Column-level stats

---

## Success Criteria

### Phase 3 Complete When:
1. ✅ Lineage tab shows upstream/downstream dependencies
2. ✅ PII detection flags sensitive columns automatically
3. ✅ Column drill-down provides detailed statistics
4. ✅ Profile tab connects to real backend API
5. ✅ Export functionality works for CSV/JSON
6. ✅ Caching reduces redundant profiling calls
7. ✅ Error handling provides clear user feedback
8. ✅ Performance: <3s for profiling, <1s for cached results

---

## Risk Mitigation

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Backend API slow | High | Implement caching, loading states |
| PII detection false positives | Medium | Allow user override, confidence scores |
| Large lineage graphs | Medium | Limit to 2 levels, virtualization |
| Export memory issues | Low | Stream large exports, limit to 10k rows |

### User Experience Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Too many tabs (5 total) | Medium | Smart tab ordering, hide advanced |
| Information overload | Medium | Progressive disclosure, tooltips |
| Slow profiling frustration | High | Show progress, allow cancellation |

---

## Future Enhancements (Phase 4+)

1. **Interactive Lineage Graph**
   - Visual node-edge diagram
   - Click to navigate to related tables
   - Impact simulation ("what if I change this?")

2. **AI-Powered Insights**
   - Anomaly detection in distributions
   - Schema drift alerts
   - Automated quality rule suggestions

3. **Collaborative Features**
   - Add table notes/documentation
   - Share profiling reports
   - Team data quality discussions

4. **Advanced Analytics**
   - Time-series profiling (trends)
   - Cross-table correlation analysis
   - Data lineage impact scoring

---

## Documentation Deliverables

- [ ] Phase 3 implementation guide
- [ ] PII detection methodology doc
- [ ] API integration tutorial
- [ ] Export feature user guide
- [ ] Phase 3 completion summary

---

## Next Steps

Start with **Feature 1: Lineage Tab** as it has the highest user value and is visually impressive. Then move to **Feature 2: PII Detection** for compliance value, followed by backend integration.

Let's begin! 🚀
