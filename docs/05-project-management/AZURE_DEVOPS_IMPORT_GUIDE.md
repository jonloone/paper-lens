# Azure DevOps Work Items Import Guide

## Overview

This guide explains how to import the 250+ work items from the production roadmap into Azure DevOps using the provided CSV file.

**Files:**
- `SPRINT_PLAN_AZURE_DEVOPS.md` - Detailed sprint plan with full context
- `AZURE_DEVOPS_WORK_ITEMS.csv` - CSV file ready for import into Azure DevOps
- `PRODUCTION_GAP_ANALYSIS.md` - Gap analysis that informed the work items

---

## Work Item Summary

**Total Work Items:** 250+
- **8 Epics** - Major phases/capabilities
- **45 Features** - Grouped functionality areas
- **120+ User Stories** - Actionable user-facing requirements
- **80+ Tasks** - Technical implementation tasks

**Total Estimated Effort:** 1,280 Story Points across 8 four-week sprints (32 weeks)

---

## Import Methods

### Method 1: CSV Import (Recommended)

Azure DevOps supports CSV import for bulk work item creation with parent-child relationships.

#### Steps:

1. **Open Azure DevOps Project**
   - Navigate to your NexusOne project
   - Go to Boards → Work Items

2. **Import CSV File**
   - Click on the ellipsis menu (⋯) in the top right
   - Select "Import Work Items" or "Import from CSV"
   - Upload `AZURE_DEVOPS_WORK_ITEMS.csv`

3. **Map Columns**
   - Ensure columns map correctly:
     - `Work Item Type` → Work Item Type
     - `Title` → Title
     - `Description` → Description
     - `Acceptance Criteria` → Acceptance Criteria (custom field)
     - `Story Points` → Story Points / Effort
     - `Priority` → Priority
     - `Tags` → Tags
     - `Area Path` → Area Path
     - `Iteration Path` → Iteration Path
     - `Parent` → Parent (for relationships)
     - `Risk` → Risk (custom field)
     - `Business Value` → Business Value
     - `Dependencies` → Related Work (custom field)

4. **Create Custom Fields (if needed)**

   If your Azure DevOps project doesn't have these custom fields, create them:

   - **Acceptance Criteria** (Multi-line text)
   - **Risk** (Picklist: High, Medium, Low)
   - **Dependencies** (Multi-line text)

   Go to: Organization Settings → Boards → Process → [Your Process] → Work item types → Add field

5. **Review and Import**
   - Review the mapping preview
   - Click "Import" to create all work items
   - Azure DevOps will create work items and establish parent-child relationships

6. **Verify Import**
   - Check that Epics → Features → User Stories → Tasks hierarchy is correct
   - Verify story points, priorities, and tags
   - Confirm iteration paths are assigned correctly

---

### Method 2: Excel Import (Alternative)

If CSV import has issues, use Excel with Azure DevOps add-in:

1. **Open Excel**
2. **Install Azure DevOps Add-in**
   - Team tab → New List
   - Connect to your Azure DevOps project
3. **Import CSV to Excel**
   - Open `AZURE_DEVOPS_WORK_ITEMS.csv` in Excel
   - Copy data to Azure DevOps-connected worksheet
4. **Publish to Azure DevOps**
   - Click "Publish" in Team tab
   - Excel will create work items in Azure DevOps

---

### Method 3: Azure CLI (For Advanced Users)

Use Azure CLI to script the import:

```bash
# Install Azure DevOps CLI extension
az extension add --name azure-devops

# Set default organization and project
az devops configure --defaults organization=https://dev.azure.com/YourOrg project=NexusOne

# Create work items from CSV (requires custom script)
# See: https://github.com/microsoft/azure-devops-cli-extension
```

---

## Post-Import Configuration

### 1. Configure Iteration Paths

Create iterations for the 8 sprints:

**Project Settings → Project Configuration → Iterations**

```
Phase 1 (Weeks 1-8)
  └─ Sprint 0 (Weeks 1-4)
  └─ Sprint 1 (Weeks 5-8)

Phase 2 (Weeks 9-20)
  └─ Sprint 2 (Weeks 9-12)
  └─ Sprint 3 (Weeks 13-16)
  └─ Sprint 4 (Weeks 17-20)

Phase 3 (Weeks 21-28)
  └─ Sprint 5 (Weeks 21-24)
  └─ Sprint 6 (Weeks 25-28)

Phase 4 (Weeks 29-32)
  └─ Sprint 7 (Weeks 29-32)
```

**Set iteration dates:**
- Assuming start date: [Your Start Date]
- Each sprint: 4 weeks (20 business days)

### 2. Configure Area Paths

Create area paths for team organization:

**Project Settings → Project Configuration → Areas**

```
NexusOne
├─ Infrastructure
├─ Security
├─ Operations
├─ DataEngineering
└─ AI
```

### 3. Set Up Teams

**Project Settings → Teams**

Create teams aligned with work streams:
- Infrastructure Team (DevOps/SRE)
- Security Team
- Data Engineering Team
- AI/ML Team
- Full-Stack Team (Frontend + Backend)

Assign area paths and iteration paths to each team.

### 4. Configure Dashboards

Create dashboards to track progress:

**Boards → Dashboards → New Dashboard**

**Suggested Widgets:**
- Sprint Burndown (per sprint)
- Cumulative Flow Diagram (overall progress)
- Velocity Chart (story points per sprint)
- Work Item Chart (by state, priority, epic)
- Query Results (blocked items, high-priority items)
- Lead Time / Cycle Time

### 5. Set Up Queries

Create saved queries for common views:

**Boards → Queries → New Query**

**Suggested Queries:**
1. **All Epics** - Work Item Type = Epic
2. **Current Sprint** - Iteration Path = @CurrentIteration
3. **Blocked Items** - State = Blocked
4. **High Priority** - Priority = 1
5. **Phase 1 Work** - Iteration Path UNDER "Phase 1"
6. **My Work Items** - Assigned To = @Me

---

## Work Item Relationships

The CSV establishes these parent-child relationships:

```
Epic (8)
└─ Feature (45)
   └─ User Story (120+)
      └─ Task (80+)
```

**Example Hierarchy:**

```
Epic: Infrastructure Foundation
├─ Feature: Multi-Region Kubernetes Deployment
│  ├─ User Story: Deploy Production Kubernetes Cluster (45 SP)
│  │  ├─ Task: Provision cloud infrastructure (8 SP)
│  │  ├─ Task: Deploy K8s control plane (13 SP)
│  │  ├─ Task: Configure worker nodes (8 SP)
│  │  └─ ... (4 more tasks)
│  └─ User Story: Configure Namespace Strategy (13 SP)
├─ Feature: Database Infrastructure
│  ├─ User Story: Deploy PostgreSQL Cluster (34 SP)
│  └─ User Story: Deploy Redis Cluster (16 SP)
└─ Feature: CI/CD Pipeline
   ├─ User Story: Implement CI Pipeline (23 SP)
   └─ User Story: Implement CD Pipeline (27 SP)
```

---

## Sprint Planning Workflow

### Before Sprint 0

1. **Import all work items** using this guide
2. **Verify epic/feature/story hierarchy** in Azure DevOps
3. **Review and refine** acceptance criteria with team
4. **Assign story points** if estimates need adjustment
5. **Set sprint dates** for all 8 sprints

### Sprint Planning Meeting (Each Sprint)

1. **Review sprint goal** from `SPRINT_PLAN_AZURE_DEVOPS.md`
2. **Pull work items** into sprint backlog
3. **Break down user stories** into additional tasks if needed
4. **Assign work items** to team members
5. **Identify dependencies** and blockers
6. **Commit to sprint** (verify capacity vs. story points)

### During Sprint

1. **Update work item states** (New → Active → Resolved → Closed)
2. **Log time** on tasks (if tracking hours)
3. **Update remaining work** on tasks
4. **Move blocked items** to "Blocked" state and add comments
5. **Update acceptance criteria** status (checkboxes)

### Sprint Review

1. **Demo completed work** to stakeholders
2. **Close completed work items**
3. **Document unfinished work** and move to next sprint
4. **Update dashboards** and velocity metrics

### Sprint Retrospective

1. **Review what went well**
2. **Identify improvements**
3. **Create action items** (as work items)
4. **Update sprint processes** in Azure DevOps

---

## Dependencies and Blocking Items

The CSV includes a `Dependencies` column that lists prerequisite work items. After import:

1. **Review dependencies** for each user story
2. **Create "Related" links** in Azure DevOps:
   - Link Type: "Predecessor" / "Successor"
   - Example: "User Story B" is blocked by "User Story A"
3. **Use Dependency Tracker** widget on dashboard to visualize critical path

**Critical Path Items** (from sprint plan):
- Infrastructure → Authentication → Tools → Governance → AI Agents → Hardening
- Cannot parallelize these major phases

**Parallelizable Work:**
- Sprints 2-4: Trino + Airflow can proceed in parallel
- Sprints 5-6: DataHub, Ranger, OPA can be developed in parallel

---

## Risk Management in Azure DevOps

The `Risk` field (High, Medium, Low) categorizes work items by risk level.

### Create Risk Dashboard Widget

**Boards → Dashboards → Add Widget → Chart for Work Items**

**Configuration:**
- Group By: Risk
- Values: Work Item Count
- Filter: State <> Closed

### Weekly Risk Review

1. **Query high-risk items**
2. **Review mitigation status** (in Description or custom field)
3. **Update risk level** as mitigation progresses
4. **Escalate blocked high-risk items** to leadership

---

## Reporting and Metrics

### Key Metrics to Track

1. **Velocity** (Story Points per Sprint)
   - Target: 160 SP per sprint
   - Track actual vs. planned

2. **Sprint Completion Rate**
   - % of committed work completed
   - Target: 90%+

3. **Cycle Time**
   - Time from Active → Closed
   - Target: < 5 days for tasks, < 10 days for stories

4. **Lead Time**
   - Time from New → Closed
   - Target: < 2 weeks for stories

5. **Defect Rate**
   - Bugs per story point
   - Target: < 0.1 bugs per SP

6. **Blocked Items**
   - Number of blocked work items
   - Target: < 5% of active items

### Azure DevOps Analytics

**Analytics → Analytics Views**

Create custom analytics views for:
- Epic progress (% completion by story points)
- Phase progress (4 phases over 32 weeks)
- Team velocity trends
- Quality metrics (bugs, test coverage)

**Power BI Integration** (Optional)

Connect Azure DevOps to Power BI for advanced reporting:
- Install "Azure DevOps" connector in Power BI Desktop
- Connect to your organization and project
- Create custom dashboards with drill-down capabilities

---

## Team Capacity Planning

### Configure Team Capacity

**Boards → Sprints → Capacity**

For each team member, set:
- **Capacity per day**: 6 hours (accounting for meetings, email)
- **Days off**: Mark holidays, PTO
- **Activity**: Assign capacity to Development, Testing, Design, etc.

### Capacity vs. Velocity

**Example for 8-person team (Sprint 0):**

```
Team Member         | Capacity/Day | Days in Sprint | Total Hours
--------------------|--------------|----------------|------------
Frontend Engineer 1 | 6 hours      | 20 days        | 120 hours
Frontend Engineer 2 | 6 hours      | 20 days        | 120 hours
Backend Engineer 1  | 6 hours      | 20 days        | 120 hours
Backend Engineer 2  | 6 hours      | 20 days        | 120 hours
Data Engineer 1     | 6 hours      | 20 days        | 120 hours
Data Engineer 2     | 6 hours      | 20 days        | 120 hours
DevOps Engineer     | 6 hours      | 20 days        | 120 hours
QA Engineer         | 6 hours      | 20 days        | 120 hours
--------------------|--------------|----------------|------------
TOTAL               |              |                | 960 hours
```

**Story Point Calibration:**
- 1 SP ≈ 6 hours (1 day for one person)
- 160 SP per sprint ≈ 960 hours
- Adjust based on team velocity after first sprint

---

## Best Practices

### 1. Keep Work Items Updated

- Update work item state daily
- Log time spent (if tracking hours)
- Add comments for decisions, blockers, questions
- Attach code commits, PRs, documentation links

### 2. Write Clear Acceptance Criteria

- Use testable conditions (Given/When/Then)
- Add checkboxes for verification
- Update acceptance criteria if requirements change
- Mark criteria as met during sprint review

### 3. Maintain Parent-Child Relationships

- Epic → Feature → User Story → Task
- Roll up story points from stories to features to epics
- Use hierarchy to track progress at multiple levels

### 4. Use Tags Effectively

Tags in CSV:
- `production` - All production-bound work
- `infrastructure`, `data-quality`, `ai-agents`, etc. - Technology areas
- `phase1`, `phase2`, `phase3`, `phase4` - Project phases

Create queries filtered by tags for focused views.

### 5. Link Related Work Items

- **Related** - General relationship
- **Predecessor/Successor** - Dependency relationship
- **Parent/Child** - Hierarchy relationship
- **Duplicate** - Duplicate work items
- **Tests** - Link test cases to user stories

### 6. Document Decisions

Use the **Discussion** section in work items to:
- Document design decisions
- Record meeting notes
- Capture stakeholder feedback
- Link to external documentation

---

## Troubleshooting Import Issues

### Issue: Parent relationships not created

**Solution:** Import in hierarchical order:
1. First import: Epics only
2. Second import: Features with Epic parents
3. Third import: User Stories with Feature parents
4. Fourth import: Tasks with User Story parents

### Issue: Custom fields not found

**Solution:** Create custom fields before import:
- Process → Work Item Types → Add Field
- Required fields: Acceptance Criteria, Risk, Dependencies

### Issue: Iteration paths not found

**Solution:** Create iteration paths before import:
- Project Configuration → Iterations → Add iterations
- Match names in CSV exactly (e.g., "Sprint 0", "Sprint 1")

### Issue: Area paths not found

**Solution:** Create area paths before import:
- Project Configuration → Areas → Add areas
- Match names in CSV exactly (e.g., "NexusOne/Infrastructure")

### Issue: Story points not importing

**Solution:** Ensure "Story Points" field exists on User Story work item type:
- Process → User Story → Add field → Story Points (Decimal)

---

## Next Steps After Import

1. **Sprint 0 Planning**
   - Schedule sprint planning meeting
   - Review Sprint 0 work items (Infrastructure Foundation)
   - Assign work items to team members
   - Verify capacity vs. 160 SP commitment

2. **Set Up CI/CD Integration**
   - Link Azure DevOps to GitHub repository
   - Configure CI pipeline to update work items on commit
   - Enable automatic work item transitions (PR merged → Resolved)

3. **Configure Notifications**
   - Set up email notifications for assigned work items
   - Configure Slack integration for work item updates
   - Create subscriptions for high-priority items

4. **Onboard Team**
   - Train team on Azure DevOps workflows
   - Share sprint plan and gap analysis documents
   - Review work item hierarchy and acceptance criteria
   - Establish sprint ceremonies (standup, planning, review, retro)

---

## Additional Resources

**Azure DevOps Documentation:**
- [Bulk import work items](https://docs.microsoft.com/en-us/azure/devops/boards/backlogs/office/bulk-add-modify-work-items-excel)
- [Work item relationships](https://docs.microsoft.com/en-us/azure/devops/boards/queries/link-work-items-support-traceability)
- [Sprint planning](https://docs.microsoft.com/en-us/azure/devops/boards/sprints/assign-work-sprint)
- [Analytics and reporting](https://docs.microsoft.com/en-us/azure/devops/report/dashboards/)

**NexusOne Project Documentation:**
- `PRODUCTION_GAP_ANALYSIS.md` - Detailed gap analysis (258 mock files identified)
- `SPRINT_PLAN_AZURE_DEVOPS.md` - Comprehensive sprint plan (15,000+ words)
- `TECH_STACK_COMPREHENSIVE.md` - Complete technology inventory
- `CLAUDE.md` - Design philosophy and product vision

---

## Support

For questions about:
- **Work item content**: Review `SPRINT_PLAN_AZURE_DEVOPS.md` for full context
- **Azure DevOps setup**: Consult Azure DevOps documentation or IT team
- **Sprint planning**: Reference sprint plan for goals, capacity, dependencies
- **Technical details**: See gap analysis and tech stack documents

---

## Conclusion

This import process will create a comprehensive, production-ready Azure DevOps project with 250+ work items organized into 8 sprints across 4 phases. The work items include:

- Detailed acceptance criteria
- Story point estimates
- Priority levels
- Risk assessments
- Dependencies
- Parent-child relationships
- Tags for filtering
- Iteration and area path assignments

After import, your team will have a clear, actionable roadmap to take NexusOne from PoC to production over 32 weeks with measurable milestones and success criteria at every stage.

**Total Investment:**
- **Timeline:** 32 weeks (8 months)
- **Team Size:** 8-12 engineers
- **Total Effort:** 1,280 Story Points
- **Infrastructure Cost:** $6,000-$13,000/month
- **Development Cost:** $560,000-$720,000

Good luck with your production implementation! 🚀
