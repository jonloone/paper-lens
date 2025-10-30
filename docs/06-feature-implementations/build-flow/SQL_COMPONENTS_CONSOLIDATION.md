# SQL Components Consolidation
**Created:** 2025-10-28
**Purpose:** Document SQL editor consolidation strategy

---

## Component Inventory

### ✅ KEEP: TiSQL System (Production)

**Core Components:**
- `components/tisql/TiSQLArtifactChat.tsx` - **PRIMARY** - Conversational SQL with cards
- `components/tisql/TiSQLEditor.tsx` - Professional CodeMirror editor
- `components/tisql/TiSQLWorkspace.tsx` - Full workspace container
- `components/tisql/TiSQLResultsPanel.tsx` - Results display
- `components/tisql/TiSQLContextPanel.tsx` - Schema browser
- `components/tisql/TiSQLRightPanel.tsx` - Right panel layout
- `components/tisql/TiSQLAIChatTab.tsx` - AI chat integration

**Why Keep:**
- Production-ready, actively used
- Full feature set: AI generation, quality checks, artifact cards
- Integrated with Trino, YData profiling, quality gates
- Modern conversational UI
- Supports Advanced toggle for technical details

---

## ❌ DELETE: Duplicate/Obsolete Components

### 1. SQLWorkspace.tsx
- **Location:** `components/build/SQLWorkspace.tsx`
- **Status:** Redirect placeholder
- **Reason:** Just displays upgrade notice, no functionality
- **Action:** DELETE

### 2. HybridSQLWorkbench.tsx
- **Location:** `components/build/HybridSQLWorkbench.tsx`
- **Status:** Alternative editor with explore/develop modes
- **Reason:** Superseded by TiSQL system, not actively used
- **Action:** DELETE

### 3. SQLEditorModal.tsx
- **Location:** `components/build/SQLEditorModal.tsx`
- **Status:** Modal wrapper with TiSQLEditor
- **Reason:** TiSQLArtifactChat provides better UX with cards
- **Action:** DELETE

### 4. SQLEditor.tsx
- **Location:** `components/tools/SQLEditor.tsx`
- **Status:** Simple right-panel editor
- **Reason:** Mock implementation, not production-ready
- **Action:** DELETE

### 5. AssistedSQLEditor.tsx
- **Location:** `components/query/AssistedSQLEditor.tsx`
- **Status:** Alternative SQL editor
- **Reason:** Superseded by TiSQL system
- **Action:** CHECK USAGE, likely DELETE

### 6. MinimalSQLEditor.tsx
- **Location:** `components/command/MinimalSQLEditor.tsx`
- **Status:** Minimal editor for command palette
- **Reason:** May be used in command palette - VERIFY FIRST
- **Action:** CHECK USAGE before deleting

### 7. SQLArtifact.tsx
- **Location:** `components/build/SQLArtifact.tsx`
- **Status:** Artifact display component
- **Reason:** Functionality integrated into TiSQLArtifactChat
- **Action:** DELETE if not used elsewhere

### 8. SQLPreview.tsx
- **Location:** `components/query/SQLPreview.tsx`
- **Status:** SQL preview component
- **Reason:** Check usage before deletion
- **Action:** CHECK USAGE

### 9. SQLChat, SQLChatHeader, SQLChatInput
- **Location:** `components/sql/SQL*.tsx`
- **Status:** Chat components
- **Reason:** TiSQLArtifactChat provides better implementation
- **Action:** DELETE

---

## ⚠️ CHECK USAGE: Keep if Actively Used

Need to verify usage before deleting:
- `MinimalSQLEditor.tsx` - May be used in command palette
- `SQLPreview.tsx` - May be used for query previews
- `AssistedSQLEditor.tsx` - Check if used in query workflows
- `SQLGenerationEngine.tsx` - May contain important logic

---

## 🗑️ DELETE: Build Step Components (Already in Plan)

These will be deleted as part of Step1-6 cleanup:
- `components/build/steps/Step3SQLWorkstation.tsx`
- `components/build/steps/Step3WriteSQL.tsx`
- `components/build/steps/Step3WriteSQL.old.tsx`
- `components/build/steps/Step3ConversationalSQL.tsx`

---

## Migration Path

### For Components Currently Using Obsolete Editors:

**Instead of:**
```typescript
import { SQLWorkspace } from '@/components/build/SQLWorkspace';
```

**Use:**
```typescript
import { TiSQLArtifactChat } from '@/components/tisql/TiSQLArtifactChat';
```

**Instead of:**
```typescript
import { SQLEditorModal } from '@/components/build/SQLEditorModal';
```

**Use:**
```typescript
import { TiSQLArtifactChat } from '@/components/tisql/TiSQLArtifactChat';
// Wrap in Dialog if modal behavior needed
```

---

## TiSQLArtifactChat Features

### Why It's the Primary Choice:

1. **Conversational Interface**
   - Natural language SQL generation
   - Pattern suggestions based on sources
   - Iterative refinement

2. **Artifact Cards**
   - ResultsArtifactCard - Preview data
   - QualityGatesCard - Quality metrics
   - DBTModelEditorCard - dbt model generation

3. **Advanced Toggle**
   - Hide/show SQL for non-technical users
   - Hide/show dbt/Airflow artifacts
   - Persona-based visibility

4. **Quality Integration**
   - Automatic profiling on execution
   - YData quality checks
   - Threshold configuration

5. **Results Management**
   - Latest result vs full history
   - Collapsible results
   - Export options

6. **Source Context**
   - Aware of selected sources
   - Schema reference
   - Smart join suggestions

---

## Files to Delete (Confirmed Duplicates)

```bash
# Confirmed safe to delete
rm components/build/SQLWorkspace.tsx
rm components/build/HybridSQLWorkbench.tsx
rm components/build/SQLEditorModal.tsx
rm components/tools/SQLEditor.tsx
rm components/sql/SQLChat.tsx
rm components/sql/SQLChatHeader.tsx
rm components/sql/SQLChatInput.tsx
rm components/build/SQLArtifact.tsx  # If not referenced elsewhere
```

## Files to Check Usage First

```bash
# Check usage with grep before deleting
grep -r "MinimalSQLEditor" --include="*.tsx" --include="*.ts"
grep -r "SQLPreview" --include="*.tsx" --include="*.ts"
grep -r "AssistedSQLEditor" --include="*.tsx" --include="*.ts"
grep -r "SQLGenerationEngine" --include="*.tsx" --include="*.ts"
```

---

## Success Criteria

✅ Only TiSQL system components remain
✅ No duplicate SQL editors
✅ All references updated to TiSQLArtifactChat
✅ Build system compiles without errors
✅ No broken imports

---

**Estimated Impact:**
- Delete: ~8 files (~2,000 lines)
- Keep: 7 TiSQL components (~5,000 lines)
- Net reduction: Simpler codebase, single SQL system

**Next Steps:**
1. Check usage of uncertain components
2. Delete confirmed duplicates
3. Update any remaining references
4. Test SQL workflows end-to-end
