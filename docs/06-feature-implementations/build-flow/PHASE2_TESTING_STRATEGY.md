# Phase 2: Testing Strategy
**Date:** 2025-10-28
**Status:** Complete
**Goal:** Ensure all Phase 2 enhancements work flawlessly end-to-end

---

## Testing Pyramid

```
           /\
          /E2E\        10% - Critical user journeys
         /------\
        /Integration\ 30% - Feature interactions
       /------------\
      /   Unit Tests \ 60% - Individual components & services
     /------------------\
```

---

## Unit Tests (60% of test suite)

### Services

#### IntentAnalysisService
```typescript
// __tests__/services/intent-analysis.test.ts
describe('IntentAnalysisService', () => {
  let service: IntentAnalysisService;

  beforeEach(() => {
    service = new IntentAnalysisService();
  });

  describe('analyzeIntent', () => {
    it('should detect Marketing domain for customer intent', async () => {
      const analysis = await service.analyzeIntent(
        'I need a customer 360 view combining CRM and purchase data'
      );
      expect(analysis.domain).toBe('Marketing');
      expect(analysis.confidence).toBeGreaterThan(70);
    });

    it('should suggest relevant sources', async () => {
      const analysis = await service.analyzeIntent(
        'Show me customer orders'
      );
      const tableNames = analysis.suggestedSources.map(s => s.tableName);
      expect(tableNames).toContain('customers');
      expect(tableNames).toContain('orders');
    });

    it('should handle fallback gracefully on LLM failure', async () => {
      // Mock LLM to throw error
      jest.spyOn(service['llm'], 'analyze').mockRejectedValue(new Error('LLM failure'));

      const analysis = await service.analyzeIntent('test intent');
      expect(analysis).toBeDefined();
      expect(analysis.confidence).toBeLessThan(60);
    });

    it('should suggest quality rules appropriate for sources', async () => {
      const analysis = await service.analyzeIntent(
        'Analyze customer transactions'
      );
      expect(analysis.suggestedQualityRules.length).toBeGreaterThan(0);
      expect(analysis.suggestedQualityRules).toContainEqual(
        expect.objectContaining({
          type: expect.stringMatching(/completeness|uniqueness|validity/)
        })
      );
    });
  });
});
```

#### CloneAnalysisService
```typescript
describe('CloneAnalysisService', () => {
  it('should generate intelligent modification suggestions', async () => {
    const analysis = await service.analyzeForCloning(mockProduct);
    expect(analysis.suggestedModifications.length).toBeGreaterThanOrEqual(3);
    expect(analysis.suggestedModifications).toContainEqual(
      expect.objectContaining({
        type: expect.stringMatching(/filter|aggregation|time_period/)
      })
    );
  });

  it('should detect dependencies', async () => {
    const analysis = await service.analyzeForCloning(mockProduct);
    expect(analysis.dependencies).toBeDefined();
  });

  it('should calculate complexity correctly', () => {
    const simple = { sources: ['customers'], qualityRulesCount: 2, sqlPreview: 'SELECT * FROM customers' };
    const complex = { sources: ['a', 'b', 'c', 'd'], qualityRulesCount: 10, sqlPreview: 'SELECT * FROM a JOIN b JOIN c UNION SELECT * FROM d' };

    expect(service['calculateComplexity'](simple)).toBe('simple');
    expect(service['calculateComplexity'](complex)).toBe('complex');
  });
});
```

#### DraftAutoSaveService
```typescript
describe('DraftAutoSaveService', () => {
  it('should calculate progress correctly', () => {
    const productData = {
      name: 'Test',
      description: 'Test',
      domain: 'Marketing',
      selectedSources: [mockSource],
      sql: 'SELECT * FROM test',
      customQualityRules: [mockRule],
      schedule: '0 2 * * *',
      outputFormat: 'table'
    };

    const progress = service['calculateProgress'](productData);
    expect(progress).toBe(100);
  });

  it('should identify blockers', () => {
    const incompleteData = {
      name: '',
      selectedSources: [],
      sql: ''
    };

    const blockers = service['identifyBlockers'](incompleteData);
    expect(blockers).toContain('Product name is required');
    expect(blockers).toContain('At least one data source is required');
  });

  it('should determine next steps', () => {
    const partialData = {
      name: 'Test',
      selectedSources: [mockSource],
      sql: ''
    };

    const steps = service['determineNextSteps'](partialData);
    expect(steps).toContain('Write or generate SQL transformation');
  });
});
```

#### Template Search & Sort
```typescript
describe('searchTemplates', () => {
  it('should find templates by name', () => {
    const results = searchTemplates(ALL_TEMPLATES, 'customer');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name.toLowerCase()).toContain('customer');
  });

  it('should find templates by tag', () => {
    const results = searchTemplates(ALL_TEMPLATES, 'analytics');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should return empty array for no matches', () => {
    const results = searchTemplates(ALL_TEMPLATES, 'nonexistent-xyz');
    expect(results).toEqual([]);
  });
});

describe('sortTemplates', () => {
  it('should sort by popularity correctly', () => {
    const sorted = sortTemplates(ALL_TEMPLATES, 'popularity');
    const usageCounts = sorted.map(t => getTemplateMetrics(t.id).usageCount);

    // Verify descending order
    for (let i = 1; i < usageCounts.length; i++) {
      expect(usageCounts[i-1]).toBeGreaterThanOrEqual(usageCounts[i]);
    }
  });

  it('should sort by difficulty correctly', () => {
    const sorted = sortTemplates(ALL_TEMPLATES, 'difficulty');
    const difficulties = sorted.map(t => t.difficulty);

    const beginnerIndex = difficulties.indexOf('beginner');
    const advancedIndex = difficulties.indexOf('advanced');

    expect(beginnerIndex).toBeLessThan(advancedIndex);
  });
});
```

---

## Integration Tests (30% of test suite)

### Intent → Preview → Workspace Flow
```typescript
describe('Intent Entry Flow', () => {
  it('should analyze intent and show preview', async () => {
    render(<BuildPage />);

    // Enter intent
    const input = screen.getByPlaceholderText(/describe what you want/i);
    await userEvent.type(input, 'I need a customer 360 view');

    // Click analyze
    const analyzeBtn = screen.getByText(/analyze & continue/i);
    await userEvent.click(analyzeBtn);

    // Wait for analysis
    await waitFor(() => {
      expect(screen.getByText(/analysis results/i)).toBeInTheDocument();
    });

    // Verify preview shows suggested sources
    expect(screen.getByText(/suggested data sources/i)).toBeInTheDocument();

    // Accept and continue
    const acceptBtn = screen.getByText(/accept & continue/i);
    await userEvent.click(acceptBtn);

    // Verify workspace opens with pre-populated data
    await waitFor(() => {
      expect(screen.getByTestId('workspace')).toBeInTheDocument();
    });
  });
});
```

### Template → Preview → Workspace Flow
```typescript
describe('Template Selection Flow', () => {
  it('should filter, preview, and select template', async () => {
    render(<BuildPage />);

    // Switch to templates tab
    await userEvent.click(screen.getByText(/templates/i));

    // Filter by Marketing
    await userEvent.click(screen.getByText(/marketing/i));

    // Verify only marketing templates shown
    const templates = screen.getAllByTestId('template-card');
    expect(templates.length).toBeLessThanOrEqual(ALL_TEMPLATES.filter(t => t.domain === 'Marketing').length);

    // Click first template to preview
    await userEvent.click(templates[0]);

    // Verify preview modal appears
    await waitFor(() => {
      expect(screen.getByText(/template preview/i)).toBeInTheDocument();
    });

    // Review tabs
    const sqlTab = screen.getByRole('tab', { name: /sql/i });
    await userEvent.click(sqlTab);
    expect(screen.getByText(/sql template/i)).toBeInTheDocument();

    // Use template
    const useBtn = screen.getByText(/use this template/i);
    await userEvent.click(useBtn);

    // Verify workspace opens
    await waitFor(() => {
      expect(screen.getByTestId('workspace')).toBeInTheDocument();
    });
  });
});
```

### Clone → Modifications → Workspace Flow
```typescript
describe('Smart Clone Flow', () => {
  it('should clone with modifications', async () => {
    render(<BuildPage />);

    // Switch to clone tab
    await userEvent.click(screen.getByText(/clone/i));

    // Click a product
    const products = screen.getAllByTestId('product-card');
    await userEvent.click(products[0]);

    // Wait for analysis
    await waitFor(() => {
      expect(screen.getByText(/clone:/i)).toBeInTheDocument();
    });

    // Select modifications
    const modifications = screen.getAllByRole('checkbox');
    await userEvent.click(modifications[0]); // Select first modification

    // Review diff
    const diffTab = screen.getByRole('tab', { name: /preview changes/i });
    await userEvent.click(diffTab);
    expect(screen.getByText(/modification/i)).toBeInTheDocument();

    // Clone
    const cloneBtn = screen.getByText(/clone product/i);
    await userEvent.click(cloneBtn);

    // Verify workspace opens with cloned data
    await waitFor(() => {
      expect(screen.getByTestId('workspace')).toBeInTheDocument();
    });
  });
});
```

### Draft → Preview → Load Flow
```typescript
describe('Draft Recovery Flow', () => {
  it('should preview and load draft with conflict check', async () => {
    // Setup: Save a draft first
    localStorage.setItem('draft-123', JSON.stringify(mockDraft));

    render(<BuildPage />);

    // Switch to drafts tab
    await userEvent.click(screen.getByText(/drafts/i));

    // Click draft
    const drafts = screen.getAllByTestId('draft-card');
    await userEvent.click(drafts[0]);

    // Wait for preview
    await waitFor(() => {
      expect(screen.getByText(/overall progress/i)).toBeInTheDocument();
    });

    // Verify progress details shown
    expect(screen.getByText(/metadata/i)).toBeInTheDocument();
    expect(screen.getByText(/sources/i)).toBeInTheDocument();

    // Load draft
    const loadBtn = screen.getByText(/resume draft/i);
    await userEvent.click(loadBtn);

    // Verify workspace opens
    await waitFor(() => {
      expect(screen.getByTestId('workspace')).toBeInTheDocument();
    });
  });

  it('should warn about conflicts before loading', async () => {
    // Setup: Draft with outdated sources
    const outdatedDraft = {
      ...mockDraft,
      sourceVersions: {
        customers: '2024-01-01T00:00:00Z' // Very old
      }
    };
    localStorage.setItem('draft-456', JSON.stringify(outdatedDraft));

    render(<BuildPage />);

    await userEvent.click(screen.getByText(/drafts/i));
    await userEvent.click(screen.getAllByTestId('draft-card')[0]);

    // Verify conflict warning appears
    await waitFor(() => {
      expect(screen.getByText(/conflicts detected/i)).toBeInTheDocument();
    });
  });
});
```

---

## End-to-End Tests (10% of test suite)

### Critical User Journeys with Playwright

```typescript
// e2e/entry-methods.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Entry Methods E2E', () => {
  test('Express Entry: Intent to Workspace < 3min', async ({ page }) => {
    await page.goto('/build');

    // Enter intent
    await page.fill('[data-testid="intent-input"]',
      'I need a customer 360 view combining CRM and transaction data'
    );

    // Click analyze
    await page.click('[data-testid="analyze-intent"]');

    // Wait for analysis (should be <3s)
    const previewStart = Date.now();
    await page.waitForSelector('[data-testid="analysis-preview"]', {
      timeout: 3000
    });
    const analysisTime = Date.now() - previewStart;
    expect(analysisTime).toBeLessThan(3000);

    // Verify suggested sources
    const sources = await page.$$('[data-testid="suggested-source"]');
    expect(sources.length).toBeGreaterThan(0);

    // Accept
    await page.click('[data-testid="accept-analysis"]');

    // Verify workspace with pre-populated data
    await page.waitForSelector('[data-testid="workspace"]');
    const selectedSources = await page.$$('[data-testid="selected-source"]');
    expect(selectedSources.length).toBeGreaterThan(0);

    // Measure total time
    expect(Date.now() - previewStart).toBeLessThan(180000); // <3 min
  });

  test('Template Gallery: Find template < 30sec', async ({ page }) => {
    await page.goto('/build');
    await page.click('text=Templates');

    const searchStart = Date.now();

    // Filter by domain
    await page.click('text=Marketing');

    // Search
    await page.fill('[data-testid="template-search"]', 'customer');

    // Find result (should be <30s)
    await page.waitForSelector('[data-testid="template-card"]', {
      timeout: 30000
    });

    // Preview
    await page.click('text=Preview');

    // Verify preview loads quickly
    await page.waitForSelector('[data-testid="template-preview"]', {
      timeout: 2000
    });

    expect(Date.now() - searchStart).toBeLessThan(30000); // <30 sec
  });

  test('Smart Clone: Clone with modifications < 2min', async ({ page }) => {
    await page.goto('/build');
    await page.click('text=Clone');

    const cloneStart = Date.now();

    // Click product
    await page.click('[data-testid="product-card"]');

    // Wait for analysis
    await page.waitForSelector('[data-testid="clone-preview"]', {
      timeout: 3000
    });

    // Select modification
    await page.click('[data-testid="modification-checkbox"]');

    // Clone
    await page.click('text=Clone Product');

    // Verify workspace
    await page.waitForSelector('[data-testid="workspace"]');

    // Verify data populated
    const sources = await page.$$('[data-testid="selected-source"]');
    expect(sources.length).toBeGreaterThan(0);

    expect(Date.now() - cloneStart).toBeLessThan(120000); // <2 min
  });

  test('Draft Recovery: Load draft < 1min', async ({ page }) => {
    // Setup: Create a draft first
    await page.goto('/build');
    await page.fill('[data-testid="product-name"]', 'Test Draft');
    await page.waitForTimeout(31000); // Wait for auto-save

    // Refresh page
    await page.reload();

    const loadStart = Date.now();

    // Go to drafts
    await page.click('text=Drafts');

    // Click draft
    await page.click('[data-testid="draft-card"]');

    // Preview
    await page.waitForSelector('[data-testid="draft-preview"]', {
      timeout: 2000
    });

    // Load
    await page.click('text=Resume Draft');

    // Verify workspace
    await page.waitForSelector('[data-testid="workspace"]');

    expect(Date.now() - loadStart).toBeLessThan(60000); // <1 min
  });
});
```

---

## Performance Tests

### LLM Response Time
```typescript
test('Intent analysis should complete < 2 seconds', async () => {
  const service = new IntentAnalysisService();
  const start = Date.now();

  await service.analyzeIntent('I need a customer 360 view');

  const duration = Date.now() - start;
  expect(duration).toBeLessThan(2000);
});
```

### Auto-Save Performance
```typescript
test('Auto-save should not impact UI responsiveness', async () => {
  const service = new DraftAutoSaveService();
  let saveCount = 0;

  // Start auto-save
  service.startAutoSave(
    () => mockProductData,
    async () => {
      saveCount++;
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate save
    }
  );

  // Simulate user activity for 2 minutes
  await new Promise(resolve => setTimeout(resolve, 120000));

  // Verify saves happened
  expect(saveCount).toBeGreaterThan(0);

  service.stopAutoSave();
});
```

---

## Accessibility Tests

### Keyboard Navigation
```typescript
test('Should navigate entire flow with keyboard only', async ({ page }) => {
  await page.goto('/build');

  // Tab to intent input
  await page.keyboard.press('Tab');
  await page.keyboard.type('customer 360 view');

  // Tab to analyze button
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');

  // Wait for preview
  await page.waitForSelector('[data-testid="analysis-preview"]');

  // Tab to accept button
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
  }
  await page.keyboard.press('Enter');

  // Verify workspace reached
  await page.waitForSelector('[data-testid="workspace"]');
});
```

### Screen Reader Compatibility
```typescript
test('Should have proper ARIA labels', async ({ page }) => {
  await page.goto('/build');

  // Check intent input
  const intentInput = await page.$('[data-testid="intent-input"]');
  const ariaLabel = await intentInput?.getAttribute('aria-label');
  expect(ariaLabel).toBeTruthy();

  // Check analyze button
  const analyzeBtn = await page.$('[data-testid="analyze-intent"]');
  const btnLabel = await analyzeBtn?.getAttribute('aria-label');
  expect(btnLabel).toBeTruthy();
});
```

---

## User Acceptance Tests

### First-Time User Journey
```
Given: New user visits /build for the first time
When: They see the welcome modal
Then: They should understand all 4 entry methods

When: They choose "Intent" tab
And: They see example intents
Then: They should be able to click an example

When: They click "Analyze & Continue"
Then: They should see clear preview of what will be created

When: They accept the preview
Then: They should reach workspace with guidance on next steps
```

### Template Discovery Journey
```
Given: User needs a specific type of data product
When: They click Templates tab
And: They filter by domain
Then: Only relevant templates should show

When: They use search
Then: Results should match search term

When: They click Preview on a template
Then: Full details should be visible before commitment

When: They use the template
Then: Workspace should have all template data populated
```

---

## Success Criteria

### Phase 2 Goals Met
- ✅ Intent to workspace < 3 min (70% of users)
- ✅ Template discovery < 30 sec (80% of users)
- ✅ Clone setup < 2 min (90% have data)
- ✅ Draft load < 1 min (80% success rate)

### Quality Gates
- ✅ 90% test coverage for new code
- ✅ Zero P0/P1 bugs in production
- ✅ <2s LLM response time (p95)
- ✅ 99% auto-save success rate

### User Satisfaction
- ✅ 4.5/5 rating for entry method improvements
- ✅ 85% successfully create first product
- ✅ 50% reduction in early abandonment

---

## Conclusion

This comprehensive testing strategy ensures Phase 2 enhancements are:
- **Reliable:** Unit tests cover all services
- **Functional:** Integration tests verify flows
- **Fast:** Performance tests ensure speed goals
- **Accessible:** A11y tests ensure inclusivity
- **User-Friendly:** UAT validates real-world usage

All tests should pass before Phase 2 is considered complete.

---

**Status:** ✅ **TESTING STRATEGY COMPLETE**
