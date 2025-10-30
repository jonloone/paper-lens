# Operations Menu: Users Placement Analysis

**Question**: Should "Users" be under Governance, or should it be its own section near Overview?

---

## Current Structure (Users in Governance)

```
Operations
├── Overview
├─────────────── RESOURCES ───────────────
├── Pipelines
├── Connections
├── Data Products
├─────────────── GOVERNANCE ──────────────
├── Quality Rules
├── Access Control
└── Users ← Currently here
```

---

## Industry Benchmark Analysis

### Databricks (Admin Console)
```
Admin Settings
├── Users                    ← TOP OF ADMIN
├── Groups
├── Service Principals
├── Access Control
└── Workspace Settings
```
**Pattern**: Users is THE FIRST item in admin

### Snowflake
```
Admin
├── Users & Roles            ← TOP OF ADMIN
├── Resource Monitors
├── Warehouses
├── Security
└── Billing
```
**Pattern**: Users is THE FIRST item in admin

### AWS IAM
```
IAM
├── Users                    ← TOP LEVEL
├── User Groups
├── Roles
├── Policies
└── Identity Providers
```
**Pattern**: Users is foundational, comes first

### Google Cloud Platform
```
IAM & Admin
├── IAM                      ← Users inside
│   ├── Principals (users)
│   ├── Roles
│   └── Service Accounts
├── Identity
└── Organization
```
**Pattern**: Users are top-level concern

### Azure Portal
```
Azure Active Directory
├── Users                    ← TOP LEVEL
├── Groups
├── Enterprise Applications
└── Roles and Administrators
```
**Pattern**: Users first

### Airflow
```
Security (top nav)
├── List Users               ← TOP OF SECURITY
├── List Roles
└── Permissions
```
**Pattern**: Users at top of security section

---

## Key Finding

**100% of major platforms put Users at or near the TOP of administrative sections, never buried at the bottom.**

---

## Conceptual Analysis

### Users = Governance? (Current)

**Arguments FOR:**
- User management IS about access/security
- Related to Access Control
- Part of compliance

**Arguments AGAINST:**
- Governance typically means data quality/policies
- Users is more operational (who can use system)
- Governance applies TO users, users aren't governance themselves
- Users feel buried at bottom of long menu

### Users = Administrative Foundation

**Why Users Should Be Near Top:**
1. **Foundational**: You need users before you can assign them to resources
2. **High Frequency**: User management is common admin task
3. **Mental Model**: Users → Resources → Governance (logical flow)
4. **Industry Standard**: Every platform puts it first

---

## Recommendation: Option 1 (Best Practice)

### Proposed Structure

```
Operations
├── Overview                 ← System health dashboard
├── Users                    ← NEW POSITION (foundational)
├─────────────── RESOURCES ───────────────
├── Pipelines               ← Operational resources
├── Connections
├── Data Products
├─────────────── GOVERNANCE ──────────────
├── Quality Rules           ← Data governance
└── Access Control          ← Security policies
```

**Benefits:**
- ✅ Matches industry standard (100% of competitors)
- ✅ Users comes early (foundational admin task)
- ✅ Clearer mental model (Users → Resources → Governance)
- ✅ Governance section is purely about data quality/security policies
- ✅ More frequently accessed items at top

**Flow Logic:**
1. **Overview** - See what's happening
2. **Users** - Who can access the system (foundational)
3. **Resources** - What they can work with (pipelines, connections, products)
4. **Governance** - Rules and controls applied (quality, access policies)

---

## Alternative: Option 2 (Also Good)

### With Overview Section

```
Operations
├── Overview
├── Users & Teams            ← Grouped with overview
├─────────────── RESOURCES ───────────────
├── Pipelines
├── Connections
├── Data Products
├─────────────── GOVERNANCE ──────────────
├── Quality Rules
└── Access Control
```

**Benefits:**
- ✅ Users grouped with "system" concerns
- ✅ Still near top
- ⚠️ But not its own item (less prominent)

---

## Why NOT Keep in Governance (Current)

**Problems with Current Structure:**

1. **Industry Anti-Pattern**
   - No major platform does this
   - Users expect it at top

2. **Mental Model Confusion**
   - Governance = rules/policies applied TO users
   - Users ≠ governance rules themselves
   - "Quality Rules" and "Users" don't feel related

3. **Buried in Menu**
   - Users at bottom of 8-item dropdown
   - Requires scrolling to reach
   - Less discoverable

4. **Wrong Categorization**
   - Quality Rules = data governance ✓
   - Access Control = security governance ✓
   - Users = identity management, not governance ✗

---

## Recommended Navigation Code

```typescript
{
  href: '/operations',
  label: 'Operations',
  icon: 'Activity',
  hasDropdown: true,
  dropdownItems: [
    {
      href: '/operations',
      label: 'Overview',
      icon: 'LayoutDashboard',
      description: 'System health and metrics'
    },
    {
      href: '/manage/users',
      label: 'Users',
      icon: 'Users',
      description: 'User management and teams'
    },
    { separator: true, label: '', sectionLabel: 'RESOURCES' },
    {
      href: '/monitor/pipelines',
      label: 'Pipelines',
      icon: 'GitBranch',
      description: 'Monitor and manage data pipelines'
    },
    {
      href: '/manage/connections',
      label: 'Connections',
      icon: 'Database',
      description: 'Data source connections'
    },
    {
      href: '/manage',
      label: 'Data Products',
      icon: 'Package',
      description: 'Manage data products'
    },
    { separator: true, label: '', sectionLabel: 'GOVERNANCE' },
    {
      href: '/govern/quality',
      label: 'Quality Rules',
      icon: 'CheckCircle',
      description: 'Data quality standards'
    },
    {
      href: '/manage/access',
      label: 'Access Control',
      icon: 'Key',
      description: 'Security and permissions'
    }
  ]
}
```

---

## User Experience Impact

### Current (Users in Governance)
```
User thinks: "I need to add a new user"
User action:
1. Click Operations
2. Hover dropdown
3. Scroll down
4. Look under "GOVERNANCE" (confusing)
5. Find "Users" at bottom
Total: 5 steps, cognitive load from wrong category
```

### Proposed (Users Near Top)
```
User thinks: "I need to add a new user"
User action:
1. Click Operations
2. See "Users" immediately (2nd item)
3. Click
Total: 3 steps, no confusion
```

**40% fewer steps, clearer mental model**

---

## Summary

**Recommendation**: ✅ **Move Users to 2nd position (after Overview)**

**Reasoning**:
1. **Industry Standard**: 100% of competitors put Users at/near top of admin
2. **Better UX**: High-frequency task should be easy to find
3. **Clearer Categorization**: Users = identity, Governance = data rules/policies
4. **Logical Flow**: Overview → Users → Resources → Governance

**Implementation**: Update TopNavigation.tsx dropdown order (5 minute change)

---

## Conclusion

Users should NOT be in Governance. It should be positioned near the top of Operations menu (2nd item after Overview) to match industry best practices and improve discoverability for this high-frequency administrative task.
