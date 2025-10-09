# How to Test the Profiling Generator

## Quick Start - Test in 3 Steps

### Step 1: Run the Example (Uses Sample Data)

```bash
npx tsx lib/generators/example-profiling.ts
```

**What it does**:
- Profiles `data-products/sample-data/customer_transactions.csv` (32 rows)
- Infers a complete ODCS contract
- Generates 9 quality rules
- Saves contract to `data-products/contracts/sales/v1.0.0/`
- Creates profiling documentation

**Expected Output**:
```
✅ Profiled 32 rows, 6 columns
✅ Inferred contract with 9 quality rules
✅ Contract saved to: .../customer_transactions.yaml
✅ Documentation saved to: .../PROFILING_REPORT.md
💡 Recommendations: ✅ Data matches contract perfectly!
```

---

### Step 2: Test with Your Own CSV File

Create a simple test script:

```typescript
// test-my-data.ts
import { profilingGenerator } from './lib/generators/profiling-generator';

async function main() {
  const result = await profilingGenerator.generateFromProfiling({
    data_source: '/path/to/your/data.csv',  // Change this!
    source_type: 'csv',
    namespace: 'my_namespace',               // Change this!
    contract_name: 'my_contract',            // Change this!
    owner: 'your.email@company.com',         // Change this!
    description: 'My test contract',
    version: '1.0.0',
  });

  console.log('✅ Success!');
  console.log(`Profiled ${result.profiling.dataset_info.n_rows} rows`);
  console.log(`Inferred ${result.inference.contract.schema.fields.length} fields`);
  console.log(`Generated ${result.inference.contract.quality.length} quality rules`);
}

main();
```

Run it:
```bash
npx tsx test-my-data.ts
```

---

### Step 3: View the Generated Contract

```bash
# View the contract
cat data-products/contracts/my_namespace/v1.0.0/my_contract.yaml

# View the profiling report
cat data-products/contracts/my_namespace/v1.0.0/PROFILING_REPORT.md
```

---

## Advanced Testing

### Test 1: Profile Only (No Contract Generation)

```typescript
import { profilingGenerator } from './lib/generators/profiling-generator';

const result = await profilingGenerator.profileDataset(
  '/path/to/data.csv',
  'csv'
);

console.log('Rows:', result.dataset_info.n_rows);
console.log('Columns:', result.dataset_info.columns);
console.log('Memory:', result.dataset_info.memory_size);
```

### Test 2: Infer Contract from Existing Data

```typescript
const result = await profilingGenerator.inferContract(
  '/path/to/data.csv',
  {
    namespace: 'sales',
    contract_name: 'transactions',
    owner: 'team@company.com',
    description: 'Transaction data',
  }
);

console.log('Contract:', result.contract);
console.log('Quality rules:', result.contract.quality.length);
```

### Test 3: Compare Data Against Contract

```typescript
// First, load an existing contract
import { contractSerializer } from './lib/services/contract-serializer';

const existingContract = await contractSerializer.loadContract(
  'data-products/contracts/sales/v1.0.0/contract.yaml'
);

// Compare new data against it
const comparison = await profilingGenerator.compareWithContract(
  '/path/to/new_data.csv',
  existingContract,
  'csv'
);

console.log('Schema differences:', comparison.schema_differences);
console.log('Quality violations:', comparison.quality_violations);
console.log('Recommendations:', comparison.recommendations);
```

---

## Run the TDD Tests

```bash
# Run all profiling tests (19 tests)
npx jest __tests__/profiling-generator.test.ts

# Run specific test
npx jest __tests__/profiling-generator.test.ts -t "should infer quality rules"

# Run with verbose output
npx jest __tests__/profiling-generator.test.ts --verbose
```

**Expected Result**: `19 passed, 19 total` ✅

---

## Test Different Data Formats

### CSV Files (Already Working)
```typescript
await profilingGenerator.profileDataset('data.csv', 'csv');
```

### Parquet Files
```typescript
await profilingGenerator.profileDataset('data.parquet', 'parquet');
```

### JSON Files
```typescript
await profilingGenerator.profileDataset('data.json', 'json');
```

---

## Validate Generated Contract

### Check Contract Structure

```bash
# Install yq if not already installed
# sudo apt-get install yq

# Validate YAML syntax
yq eval '.' data-products/contracts/sales/v1.0.0/customer_transactions.yaml

# Check specific fields
yq eval '.metadata.name' customer_transactions.yaml
yq eval '.schema.fields | length' customer_transactions.yaml
yq eval '.quality | length' customer_transactions.yaml
```

### Verify Quality Rules

```bash
# Count quality rules by type
yq eval '.quality | group_by(.type) | map({"type": .[0].type, "count": length})' customer_transactions.yaml
```

---

## Generate Code from Inferred Contract

After profiling and reviewing the contract, generate code:

```bash
# Use the inferred contract to generate all code artifacts
npx tsx lib/generators/example-generation.ts

# This generates:
# - dbt models
# - SQLMesh models
# - Airflow DAGs
# - Great Expectations suites
```

---

## Common Test Scenarios

### Scenario 1: New Data Source Discovery

**Use Case**: You found an existing CSV file and want to create a contract

```bash
# 1. Profile the data
npx tsx -e "
import { profilingGenerator } from './lib/generators/profiling-generator';
const r = await profilingGenerator.generateFromProfiling({
  data_source: '/path/to/discovered_data.csv',
  namespace: 'discovered',
  contract_name: 'unknown_data',
  owner: 'data-team@company.com',
  description: 'Newly discovered dataset'
});
console.log('Done!');
"

# 2. Review the generated contract
cat data-products/contracts/discovered/v1.0.0/unknown_data.yaml

# 3. Manually adjust:
#    - Change data types (e.g., string -> timestamp for dates)
#    - Update SLA requirements
#    - Set classification
#    - Add source lineage

# 4. Generate code
npx tsx lib/generators/example-generation.ts
```

### Scenario 2: Data Quality Monitoring

**Use Case**: Check if new data matches existing contract

```bash
# Compare new data against contract
npx tsx -e "
import { profilingGenerator, contractSerializer } from './lib';
const contract = await contractSerializer.loadContract('path/to/contract.yaml');
const comparison = await profilingGenerator.compareWithContract(
  'new_data.csv',
  contract
);
console.log('Violations:', comparison.quality_violations);
"
```

### Scenario 3: Contract Evolution

**Use Case**: Data structure changed, need to update contract

```bash
# 1. Profile new version of data
# 2. Compare with old contract
# 3. Review differences
# 4. Update contract version
# 5. Regenerate code
```

---

## Troubleshooting

### Issue: "Profiling failed"

**Check**:
1. File exists at the path
2. File has correct format (CSV, Parquet, JSON)
3. File is readable
4. Python dependencies installed (`ydata-profiling`)

```bash
# Test Python service directly
python3 lib/services/ydata-profiling-service.py profile test.csv csv
```

### Issue: "No quality rules generated"

**Possible Reasons**:
1. All columns have >5% missing data (no completeness rules)
2. All columns have <95% uniqueness (no uniqueness rules)
3. No numeric columns (no statistical bounds)

**Solution**: This is expected for sparse or non-unique data. Add business rules manually.

### Issue: "Type inference incorrect"

**Known Limitation**: Date strings detected as "string" not "timestamp"

**Solution**: Manually edit the contract to correct types:
```yaml
# Change this:
- name: created_date
  type: string

# To this:
- name: created_date
  type: timestamp
```

---

## Performance Testing

### Test with Different Dataset Sizes

```bash
# Small (100 rows)
time npx tsx -e "
import { profilingGenerator } from './lib/generators/profiling-generator';
await profilingGenerator.profileDataset('small.csv', 'csv');
"

# Medium (10,000 rows)
time npx tsx -e "..."

# Large (100,000 rows)
time npx tsx -e "..."
```

**Expected Performance**:
- 100 rows: ~1-2 seconds
- 10,000 rows: ~5-10 seconds
- 100,000 rows: ~30-60 seconds

---

## What to Look For in Results

### ✅ Good Contract Characteristics

1. **Schema Fields**:
   - All columns detected
   - Reasonable type mappings
   - Useful constraints (min/max, lengths)

2. **Quality Rules**:
   - Completeness rules for required fields
   - Uniqueness rules for ID columns
   - Validity rules with correct ranges
   - Statistical bounds for numeric fields

3. **Metadata**:
   - Clear descriptions
   - Correct owner and namespace
   - Appropriate tags

### ⚠️ Review Required

1. **Data Types**: String dates should be timestamps
2. **SLA**: Default values need adjustment
3. **Classification**: Default "internal" needs review
4. **Criticality**: Default "medium" needs review
5. **Sources**: Need to add source lineage manually

---

## Next Steps After Testing

1. ✅ **Review Generated Contract**
   - Fix data types
   - Adjust quality rule thresholds
   - Update metadata

2. ✅ **Save Refined Contract**
   ```bash
   # Contract is already saved, just edit it
   vim data-products/contracts/namespace/version/contract.yaml
   ```

3. ✅ **Generate Code**
   ```bash
   npx tsx lib/generators/example-generation.ts
   ```

4. ✅ **Deploy**
   ```bash
   # Test dbt model
   dbt test --models my_model

   # Run pipeline
   dbt run --models my_model
   ```

---

## Summary

**Quick Test**: `npx tsx lib/generators/example-profiling.ts`

**Full TDD Tests**: `npx jest __tests__/profiling-generator.test.ts`

**Your Own Data**: Create a script like the examples above

**Expected Results**:
- ✅ Contract generated in ~1 second
- ✅ Schema fields match your data
- ✅ Quality rules inferred from statistics
- ✅ Documentation auto-generated
- ✅ Ready for manual review and refinement

Have fun profiling! 🚀
