# Documentation Standards and Procedures - StudyForge

This document contains detailed procedures and standards for documentation maintenance in StudyForge. Used by the `docs-sentinel` agent via `doc-retriever` skill.

**Last Updated**: 2025-11-29
**Version**: 1.0.0

---

## Table of Contents

- [Documentation Hierarchy](#documentation-hierarchy)
- [Structural Change Detection](#structural-change-detection)
- [Code Example Validation](#code-example-validation)
- [Audit Workflows](#audit-workflows)
- [Common Issues and Fixes](#common-issues-and-fixes)

---

## <a id="documentation-hierarchy"></a>Documentation Hierarchy

### Single Source of Truth Principle

```
docs/ (Detailed Source of Truth)
  ├── ARCHITECTURE.md    # System design (authoritative)
  ├── DATABASE.md        # Schema details (authoritative)
  ├── API.md             # Endpoint reference (authoritative)
  ├── DECISIONS.md       # Technical decisions (authoritative)
  ├── SECURITY.md        # Security guide (authoritative)
  └── TESTING.md         # Testing strategy (authoritative)

CLAUDE.md (Comprehensive AI Assistant Guide)
  └── References and summarizes docs/ with AI-specific guidance

README.md (High-level Project Overview)
  └── Brief overview that links to detailed docs/
```

### Hierarchy Rules

1. **docs/** = Detailed, authoritative information
2. **CLAUDE.md** = Comprehensive guide with references to docs/
3. **README.md** = Brief overview with links to docs/
4. **Never duplicate** detailed information; always link to the source
5. **Update propagation**: docs/ changes → CLAUDE.md → README.md

### Documentation Sections to Maintain

**CLAUDE.md**:
- Project Overview
- Technology Stack
- Repository Structure
- Code Conventions
- Key Architectural Decisions
- Testing Strategy
- Common Tasks
- Custom Agents

**README.md**:
- Project Description (one paragraph)
- Features (bullet list)
- Quick Start (installation and running)
- Documentation Links
- Technology Stack (brief)
- Contributing

**docs/ Files**:
- `ARCHITECTURE.md` - Components, data flow, tech stack
- `DATABASE.md` - Schema, migrations, indexing
- `API.md` - Endpoints, schemas, auth
- `DECISIONS.md` - ADRs with date, context, decision
- `SECURITY.md` - Auth flow, authorization, vulnerabilities
- `TESTING.md` - Strategy, commands, best practices

---

## <a id="structural-change-detection"></a>Structural Change Detection

### Critical Paths to Monitor

#### Backend Structure (`backend/`)

**Routers** (`backend/app/routers/`):
```
New router file → Update docs/API.md
Deleted router → Remove from docs/API.md, note in docs/DECISIONS.md
```

**Detection**:
```bash
Glob "backend/app/routers/*.py"
# Compare against documented endpoints in docs/API.md
```

**Models** (`backend/app/models/`):
```
New model file → Update docs/DATABASE.md schema
Modified model → Verify migration exists, update docs
```

**Detection**:
```bash
Glob "backend/app/models/*.py"
# Compare against documented tables in docs/DATABASE.md
```

**Schemas** (`backend/app/schemas/`):
```
New schema file → Update docs/API.md examples
Changed validation → Document in docs/API.md
```

**Migrations** (`backend/alembic/versions/`):
```
New migration → Ensure docs/DATABASE.md reflects change
Migration count changed → Update schema documentation
```

**Detection**:
```bash
Glob "backend/alembic/versions/*.py"
# Count migrations, check if last migration is documented
```

**Dependencies** (`backend/requirements.txt`):
```
New dependency → Update CLAUDE.md Tech Stack
Removed dependency → Update docs, note in docs/DECISIONS.md
```

**Detection**:
```bash
Read backend/requirements.txt
# Compare against documented stack in CLAUDE.md
```

**Configuration** (`backend/app/config.py`, `backend/.env.example`):
```
New config variable → Document in appropriate section
Changed defaults → Update setup documentation
```

#### Frontend Structure (`frontend/`)

**Pages** (`frontend/src/pages/`):
```
New page → Update CLAUDE.md Features, possibly README.md
New subdirectory → Update docs/ARCHITECTURE.md
```

**Detection**:
```bash
Glob "frontend/src/pages/**/*.tsx"
# Compare against documented features
```

**Components** (`frontend/src/components/`):
```
New major component category → Update docs/ARCHITECTURE.md
Reorganized structure → Update file paths in docs
```

**API Services** (`frontend/src/services/api/`):
```
New API service file → Cross-check with docs/API.md
```

**Dependencies** (`frontend/package.json`):
```
New library → Update CLAUDE.md Tech Stack
Major version bump → Check if docs need updates
New script → Update setup documentation
```

**Detection**:
```bash
Read frontend/package.json
# Compare against documented stack in CLAUDE.md
```

**Configuration** (`frontend/vite.config.ts`, `frontend/tsconfig.json`):
```
Build config change → Update setup docs if relevant
```

### Detection Workflow

#### Step 1: Scan for New Directories

```bash
# Use Glob to find all directories
Glob "backend/app/*/"
Glob "frontend/src/*/"

# Compare against documented structure in docs/ARCHITECTURE.md
# Flag any directories not mentioned
```

**Output format**:
```markdown
🔍 **New Directory Detected**: `backend/app/tasks/`

**Current State**:
- Directory exists in codebase
- Not documented in `docs/ARCHITECTURE.md`

**Recommendation**:
- Investigate purpose (scheduled tasks? background jobs?)
- Add to `docs/ARCHITECTURE.md` Backend Structure section
- Document in `CLAUDE.md` if affects development workflow
```

#### Step 2: Scan for New Critical Files

```bash
# Routers (new endpoints)
Glob "backend/app/routers/*.py"
# Compare against docs/API.md sections

# Models (new tables)
Glob "backend/app/models/*.py"
# Compare against docs/DATABASE.md schema

# Frontend pages (new routes)
Glob "frontend/src/pages/**/*.tsx"
# Compare against documented features
```

**Output format**:
```markdown
🔍 **New Router Detected**: `backend/app/routers/notifications.py`

**Current State**:
- File created: `notifications.py` (60 lines)
- Contains endpoints: GET /notifications, POST /notifications/mark-read
- Not documented in `docs/API.md`

**Impact**: New API endpoints available but undocumented

**Recommendation**:
1. Add "Notifications" section to `docs/API.md`
2. Document both endpoints with request/response examples
3. Update `CLAUDE.md` Features if user-facing
4. Update `README.md` if major feature
```

#### Step 3: Monitor Dependency Changes

```bash
# Read dependency files
Read backend/requirements.txt
Read frontend/package.json

# Compare against documented tech stack in CLAUDE.md
```

**Output format**:
```markdown
🔍 **New Dependency Detected**: `celery==5.3.4` in `requirements.txt`

**Current State**:
- Added to dependencies
- Not mentioned in `CLAUDE.md` Technology Stack
- Not documented in `docs/ARCHITECTURE.md`

**Impact**: Major architectural change (async task processing)

**Recommendation**:
1. Add Celery to `CLAUDE.md` Technology Stack (Backend section)
2. Document task queue architecture in `docs/ARCHITECTURE.md`
3. Add task development workflow to `CLAUDE.md` Common Tasks
4. Update `docs/DECISIONS.md` with why Celery was chosen
```

#### Step 4: Check Configuration Changes

```bash
# Read configuration files
Read backend/.env.example
Read backend/app/config.py
Read frontend/vite.config.ts

# Compare against setup documentation
```

**Output format**:
```markdown
🔍 **New Config Variable**: `REDIS_URL` in `.env.example`

**Current State**:
- Added to `.env.example`
- Added to `config.py` as `REDIS_URL: str`
- Not mentioned in setup documentation

**Recommendation**:
1. Update `README.md` Quick Start to include Redis installation
2. Add Redis to `CLAUDE.md` Technology Stack
3. Document Redis usage in `docs/ARCHITECTURE.md` (caching? sessions?)
4. Update `docs/DATABASE.md` if used for caching queries
```

#### Step 5: Detect Migration Changes

```bash
# List migrations
Glob "backend/alembic/versions/*.py"

# Compare against documented schema in docs/DATABASE.md
```

**Output format**:
```markdown
🔍 **New Migration**: `2025_11_29_add_notification_table.py`

**Current State**:
- Migration adds `notifications` table
- `docs/DATABASE.md` doesn't document this table

**Recommendation**:
1. Add `notifications` table schema to `docs/DATABASE.md`
2. Document relationships (user_id FK, etc.)
3. Update ER diagram (text-based) if present
4. Document any new indexes created
```

### Proactive Alerts

**Alert triggers**:

1. **New router without API documentation**
   - Detection: New `.py` file in `backend/app/routers/`
   - Alert: "New endpoints not documented in docs/API.md"

2. **New model without database documentation**
   - Detection: New `.py` file in `backend/app/models/`
   - Alert: "New table not documented in docs/DATABASE.md"

3. **Major dependency added**
   - Detection: New library in `requirements.txt` or `package.json`
   - Alert: "New dependency not reflected in CLAUDE.md Tech Stack"

4. **Configuration change**
   - Detection: New variable in `.env.example`
   - Alert: "New environment variable not documented"

5. **New directory**
   - Detection: New subdirectory in critical paths
   - Alert: "New directory structure not in docs/ARCHITECTURE.md"

6. **Migration without docs**
   - Detection: New file in `alembic/versions/`
   - Alert: "Database migration not reflected in docs/DATABASE.md"

---

## <a id="code-example-validation"></a>Code Example Validation

### Validation Process

#### Step 1: Extract Code Snippets

```markdown
# Find all code blocks in documentation
Read CLAUDE.md
Read README.md
Read docs/ARCHITECTURE.md

# Extract code blocks marked as ```python, ```typescript, ```bash
```

#### Step 2: Compare with Actual Code

**Python Examples**:
```bash
# Check if pattern exists in codebase
Grep "<pattern from example>" backend/app/
```

**TypeScript Examples**:
```bash
# Check if pattern exists in codebase
Grep "<pattern from example>" frontend/src/
```

**Bash Commands**:
```bash
# Manually verify command works
# Or check if referenced files exist
```

#### Step 3: Identify Outdated Patterns

**Common outdated patterns to detect**:

| Documented Pattern | Should Be | Detection |
|-------------------|-----------|-----------|
| `db.query(Model)` | `select(Model)` | Grep "db.query" docs |
| `@app.on_event("startup")` | `lifespan` context manager | Grep "@app.on_event" docs |
| `<a href="/path">` | `<Link to="/path">` | Grep "href=" in frontend docs |
| `window.location.href` | `navigate()` | Grep "window.location" docs |

### Validation Output Format

```markdown
## 📝 Code Example Validation Report

**Files Checked**: X
**Code Blocks Found**: Y
**Issues Detected**: Z

---

### ❌ Outdated Examples

#### 1. SQLAlchemy Query API (CLAUDE.md:245)

**Current Documentation**:
```python
db.query(Summary).filter(Summary.user_id == user_id).all()
```

**Should Be**:
```python
from sqlalchemy import select
stmt = select(Summary).where(Summary.user_id == user_id)
db.execute(stmt).scalars().all()
```

**Location**: `CLAUDE.md` line 245
**Priority**: 🔴 HIGH (misleads developers)

---

### ✅ Verified Examples

- `backend/app/core/security.py` Argon2 usage ✓
- `frontend/src/context/AuthContext.tsx` useAuth hook ✓
- `backend/app/routers/summaries.py` ownership validation ✓

---

### 📋 Recommendations

1. Update CLAUDE.md line 245 with SQLAlchemy 2.0 pattern
2. Add note about deprecated patterns to avoid
3. Run validation monthly to catch regressions
```

---

## <a id="audit-workflows"></a>Audit Workflows

### Workflow 1: Full Documentation Audit

**When**: Periodic audit or before releases

**Steps**:
1. Read all documentation files (CLAUDE.md, README.md, docs/*)
2. Scan codebase structure (Glob for routers, models, pages, etc.)
3. Compare documented vs actual structure
4. Validate all code examples
5. Check for broken links
6. Verify terminology consistency
7. Generate comprehensive report

**Commands**:
```bash
# Read all docs
Read CLAUDE.md
Read README.md
Glob "docs/*.md"

# Scan structure
Glob "backend/app/routers/*.py"
Glob "backend/app/models/*.py"
Glob "frontend/src/pages/**/*.tsx"

# Verify dependency docs
Read backend/requirements.txt
Read frontend/package.json
```

### Workflow 2: Change-Triggered Update

**When**: Specific change reported (new feature, endpoint, etc.)

**Steps**:
1. Identify change scope (backend? frontend? database?)
2. Load relevant documentation standards
3. Read affected files
4. Determine which docs need updates
5. Propose specific changes
6. Apply updates (if permitted)

**Example - New Endpoint**:
```bash
# Read the new endpoint
Read backend/app/routers/new_router.py

# Check if documented
Grep "new_router" docs/API.md

# If missing: Propose addition to docs/API.md
```

### Workflow 3: Structural Change Detection

**When**: Proactive monitoring or user request

**Steps**:
1. Scan all critical paths (routers, models, pages, dependencies)
2. Compare against last known state (documented structure)
3. Identify new/removed/changed items
4. Generate change detection report
5. Recommend documentation updates

**Commands**:
```bash
# Scan backend structure
Glob "backend/app/routers/*.py"
Glob "backend/app/models/*.py"
Glob "backend/alembic/versions/*.py"

# Scan frontend structure
Glob "frontend/src/pages/**/*.tsx"
Glob "frontend/src/components/**/*.tsx"

# Check dependencies
Read backend/requirements.txt
Read frontend/package.json

# Check config
Read backend/.env.example
Read frontend/vite.config.ts
```

### Workflow 4: Code Example Validation

**When**: User requests validation or periodic check

**Steps**:
1. Extract all code blocks from documentation
2. For each example:
   - Identify language (Python, TypeScript, bash)
   - Check syntax
   - Compare with actual codebase
   - Verify imports/dependencies exist
3. Flag outdated or incorrect examples
4. Propose corrections

---

## <a id="common-issues-and-fixes"></a>Common Issues and Fixes

### Issue 1: Outdated Code Examples

**Problem**: Documentation shows deprecated pattern

**Detection**:
```bash
# Search for legacy patterns in docs
Grep "db.query" CLAUDE.md
Grep "@app.on_event" CLAUDE.md
Grep "window.location.href" docs/
```

**Fix**:
```markdown
# Update example to current pattern
Old: db.query(User).filter(User.id == user_id)
New: from sqlalchemy import select
     stmt = select(User).where(User.id == user_id)
     db.execute(stmt).scalar_one_or_none()
```

### Issue 2: Missing New Features

**Problem**: New endpoint not documented in API.md

**Detection**:
```bash
# Compare routers with API.md
Glob "backend/app/routers/*.py"
# Check each router is documented
Grep "<router_name>" docs/API.md
```

**Fix**:
1. Read new endpoint code
2. Add section to `docs/API.md`:
   - Method and path
   - Request schema
   - Response schema
   - Authentication required
   - Example usage

### Issue 3: Broken Internal Links

**Problem**: CLAUDE.md references non-existent docs/ file

**Detection**:
```bash
# Extract links from documentation
Grep "\[.*\](.*\.md" CLAUDE.md
# Verify each target exists
```

**Fix**:
- Update link to correct file
- Or create missing documentation

### Issue 4: Duplicate Information

**Problem**: Same detail in both CLAUDE.md and docs/API.md

**Detection**:
```bash
# Compare sections for duplication
Read CLAUDE.md
Read docs/API.md
# Manual analysis for duplicate content
```

**Fix**:
```markdown
# Keep detail only in docs/
# CLAUDE.md should reference:
"See complete API reference in docs/API.md#section-name"
```

### Issue 5: Inconsistent Terminology

**Problem**: Same concept called different names

**Detection**:
```bash
# Search for term variations
Grep "study space" CLAUDE.md
Grep "study_space" CLAUDE.md
Grep "StudySpace" CLAUDE.md
```

**Fix**:
- Standardize: "study space" in prose
- "study_space" in code/paths
- "StudySpace" in TypeScript types

### Issue 6: File Paths Out of Date

**Problem**: Documented path doesn't match actual structure

**Detection**:
```bash
# Verify paths referenced in docs
Grep "backend/app/" CLAUDE.md
# Check each path exists
```

**Fix**:
- Update paths to match current structure
- Add note if path changed recently

---

## Report Templates

### Structural Change Report

```markdown
## 🔍 Structural Change Detection Report

**Scan Date**: [timestamp]
**Changes Detected**: X
**Critical**: Y
**High**: Z
**Medium**: W

---

### Critical Changes

#### 1. New API Router Detected
**File**: `backend/app/routers/notifications.py`
**Type**: New Endpoint Group
**Status**: ⚠️ Undocumented

**Details**:
- Endpoints: GET /notifications, POST /notifications/mark-read
- Lines of code: 60

**Documentation Impact**:
- 🔴 `docs/API.md` - Missing documentation
- 🟡 `CLAUDE.md` - May need feature update
- 🟡 `README.md` - Update if major

**Actions**:
1. Document endpoints in `docs/API.md`
2. Add examples
3. Update feature list

---

[Repeat for each change...]

### Documentation Freshness
- `CLAUDE.md`: ⚠️ Needs Update
- `docs/API.md`: ⚠️ Needs Update
- `docs/ARCHITECTURE.md`: ⚠️ Needs Update
- `docs/DATABASE.md`: ✅ Current

### Next Steps
1. [Prioritized actions...]
```

### Code Validation Report

```markdown
## 📝 Code Example Validation Report

**Files Checked**: X
**Examples Found**: Y
**Issues**: Z

---

### ❌ Outdated Examples

#### CLAUDE.md:245 - SQLAlchemy Query
**Current**:
```python
db.query(Summary).filter(...)
```

**Should Be**:
```python
select(Summary).where(...)
```

**Priority**: 🔴 HIGH

---

### ✅ Verified

- Argon2 usage ✓
- JWT auth ✓
- React Router ✓

---

### Actions
1. Update line 245
2. Add deprecation note
```

---

**Last Updated**: 2025-11-29
**Version**: 1.0.0
