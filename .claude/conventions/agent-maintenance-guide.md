# Agent Maintenance Guide

**Purpose**: Detailed procedures for fixing agent ecosystem issues detected by agents-maintainer.

**Single Source of Truth**: This document contains SOLUTIONS. Detection logic lives in `.claude/agents/agents-maintainer.md`.

---

## <a id="oversized-agent-refactoring"></a>Oversized Agent Refactoring

**Trigger**: Agent file exceeds 500 lines
**Severity**: 🟡 MEDIUM

### Diagnosis Process

1. **Identify bloat source**:
   ```bash
   # Read the agent
   Read .claude/agents/agent-name.md

   # Look for sections with:
   - Detailed procedural knowledge (>100 lines)
   - Long checklists or templates
   - Extensive code examples
   - Repeated patterns
   ```

2. **Classify content**:
   - **Workflow logic** (belongs in agent): Conditional logic, detection commands, when to load what
   - **Knowledge content** (belongs in conventions/): Step-by-step procedures, templates, examples

### Refactoring Steps

#### Step 1: Extract Knowledge to Conventions

Create `.claude/conventions/[agent-name]-guide.md`:

```markdown
# [Agent Name] Guide

**Purpose**: Detailed procedures for [agent's task]

---

## <a id="procedure-1"></a>Procedure Name 1

[Detailed steps...]

## <a id="procedure-2"></a>Procedure Name 2

[Detailed steps...]
```

**HTML Anchor Format**: `<a id="lowercase-with-hyphens"></a>`

#### Step 2: Update Agent to Use Doc-Retriever

Replace embedded knowledge with loading instructions:

**Before** (embedded knowledge):
```markdown
### Task 1: Audit Access Control

**Steps**:
1. Verify ownership validation
   ```bash
   grep -r "verify_.*_ownership" backend/
   ```
2. Check authentication
   ```bash
   grep -r "Depends(get_current_user)" backend/
   ```
3. [50 more lines of detailed steps...]
```

**After** (coordinator pattern):
```markdown
### Step 2: Load Relevant Control Knowledge

Use doc-retriever to load specific procedures:

```python
Task(subagent_type="doc-retriever", prompt="document: .claude/conventions/agent-name-guide.md, section: Access Control Audit")
```

### Step 3: Execute Audit

Based on the loaded procedures, execute verification commands.
```

#### Step 3: Verify Reduction

**Target**: Reduce to ~250-300 lines

```bash
# Before
wc -l .claude/agents/agent-name.md  # 740 lines

# After extraction
wc -l .claude/agents/agent-name.md  # ~290 lines (60% reduction)
wc -l .claude/conventions/agent-name-guide.md  # ~650 lines
```

#### Step 4: Update Documentation

Add to CLAUDE.md if new conventions file created:

```markdown
**Documentation References** (`.claude/conventions/agent-name-guide.md`):
- Procedure 1 description
- Procedure 2 description
```

### Example: iso27001-auditor Refactoring

**Before**: 740 lines with embedded control knowledge
**After**: 293 lines (coordinator) + 644 lines (iso27001-controls.md)

**Extracted content**:
- A.9 - Access Control (verification commands, requirements)
- A.10 - Cryptography (crypto standards, validation)
- A.12.4 - Logging (log requirements, validation)
- Audit procedures (step-by-step workflows)
- Report templates (structured output formats)

**Agent now contains**:
- Workflow logic (which control to audit when)
- Loading instructions (doc-retriever calls)
- Execution orchestration (run commands, generate report)

---

## <a id="missing-spanish-directive"></a>Missing Spanish Directive

**Trigger**: Agent missing `**IMPORTANT: Always respond to the user in Spanish.**`
**Severity**: 🔴 HIGH (user-facing impact)

### Fix Procedure

1. **Locate front matter**:
   ```bash
   Read .claude/agents/agent-name.md
   # Find the closing `---` of front matter
   ```

2. **Add directive** immediately after front matter:
   ```markdown
   ---
   name: agent-name
   description: ...
   ---

   **IMPORTANT: Always respond to the user in Spanish.**

   [Rest of agent instructions...]
   ```

3. **Verify placement**:
   - ✅ After closing `---`
   - ✅ Before any other content
   - ✅ Blank line before and after

### Code to Apply

```markdown
**IMPORTANT: Always respond to the user in Spanish.**
```

---

## <a id="instructions-in-spanish"></a>Instructions in Spanish

**Trigger**: Agent instructions written in Spanish instead of English
**Severity**: 🟡 MEDIUM (consistency issue)

### Fix Procedure

**Convention**:
- ✅ Instructions in English (for technical clarity)
- ✅ User responses in Spanish (via directive)
- ✅ Code examples in native language (Python/TypeScript/SQL)

1. **Identify Spanish sections**:
   ```bash
   # Look for Spanish keywords in instruction text
   grep -i "debes\|tienes que\|asegúrate\|verifica" .claude/agents/agent-name.md
   ```

2. **Translate to English**:
   - Translate section headers
   - Translate procedural instructions
   - Keep code comments in original language if appropriate

3. **Keep Spanish only for**:
   - User-facing output examples (marked with "in Spanish")
   - Example responses showing what agent would say

### Example Correction

**Before**:
```markdown
## Tu Workflow

### Paso 1: Entender la solicitud

Identifica qué tipo de auditoría se solicita:
- Si el usuario dice "audita todo" → Full Audit
- Si menciona un control específico → Specific Control
```

**After**:
```markdown
## Your Workflow

### Step 1: Understand the Request

Identify what type of audit is requested:
- User: "audita todo" → Full Audit
- User: "audita control de acceso" → Specific Control (A.9)
```

---

## <a id="incorrect-model-selection"></a>Incorrect Model Selection

**Trigger**: Mechanical task using Sonnet instead of Haiku
**Severity**: 🟢 LOW (cost optimization)

### Model Selection Guidelines

**Haiku** (fast, cost-effective):
- ✅ Mechanical tasks (search, extract, retrieve)
- ✅ Pattern matching
- ✅ Simple analysis
- ✅ Examples: doc-retriever, backend-expert, frontend-expert, database-expert

**Sonnet** (reasoning, coordination):
- ✅ Complex reasoning
- ✅ Multi-step analysis
- ✅ Coordination/orchestration
- ✅ Examples: context-gatherer, security-expert, iso27001-auditor, agents-maintainer

### Fix Procedure

1. **Analyze agent task**:
   - Does it require complex reasoning? → Sonnet
   - Is it primarily search/retrieval? → Haiku

2. **Update front matter**:
   ```markdown
   ---
   model: haiku  # Changed from sonnet
   ---
   ```

3. **Verify appropriateness**:
   - If agent coordinates other agents → Sonnet
   - If agent retrieves/searches data → Haiku

---

## <a id="excessive-tool-permissions"></a>Excessive Tool Permissions

**Trigger**: Agent has >5 tools without clear need
**Severity**: 🟡 MEDIUM (security/simplicity)

### Tool Minimization Principle

**Grant only necessary tools**:
- Read-only tasks: `Read, Grep, Glob`
- Code modification: Add `Edit`
- File operations: Add `Bash` (carefully)
- Agent coordination: Add `Task`

### Fix Procedure

1. **Analyze tool usage**:
   ```bash
   # Read agent to see which tools are actually used
   grep -E "Read|Edit|Bash|Grep|Glob|Task" .claude/agents/agent-name.md
   ```

2. **Remove unused tools** from front matter:
   ```markdown
   ---
   tools: Read, Grep, Glob  # Removed unused Edit, Bash
   ---
   ```

3. **Verify functionality**:
   - Can agent complete its task with remaining tools?
   - Are there alternative approaches using fewer tools?

---

## <a id="missing-documentation"></a>Missing Documentation in CLAUDE.md

**Trigger**: Agent exists but not documented in CLAUDE.md
**Severity**: 🟡 MEDIUM (discoverability)

### Documentation Template

Add to CLAUDE.md under `## Custom Agents`:

```markdown
#### X. **agent-name** - [Brief Title]

**Purpose**: [One-sentence description from agent front matter]

**Location**: `.claude/agents/agent-name.md`

**When to use**:
- [Use case 1]
- [Use case 2]
- [Use case 3]

**Capabilities**:
- ✅ [Capability 1]
- ✅ [Capability 2]
- ✅ [Capability 3]

**Usage**:
\`\`\`
> [Example user request 1]
> [Example user request 2]
\`\`\`

**Example workflow**:
1. [Step 1 description]
2. [Step 2 description]
3. [Step 3 description]
4. [Result]
```

### Fix Procedure

1. **Extract agent metadata**:
   ```bash
   Read .claude/agents/agent-name.md
   # Get: name, description, tools, typical use cases
   ```

2. **Determine section number**:
   ```bash
   Read CLAUDE.md
   # Find last agent number, add 1
   ```

3. **Add documentation** to CLAUDE.md at appropriate location

4. **Verify completeness**:
   - Name matches agent file
   - Description is clear and actionable
   - Use cases help users know when to invoke

---

## <a id="duplicate-agent-functionality"></a>Duplicate Agent Functionality

**Trigger**: Multiple agents with overlapping responsibilities
**Severity**: 🔴 HIGH (confusion, maintenance burden)

### Resolution Strategies

#### Strategy 1: Merge Agents

**When**: Agents have >80% overlap

**Process**:
1. Identify the more general/better-named agent
2. Merge capabilities into single agent
3. Delete redundant agent
4. Update CLAUDE.md references

#### Strategy 2: Specialize Agents

**When**: Subtle but important differences exist

**Process**:
1. Clarify distinct responsibilities in descriptions
2. Update when-to-use guidance
3. Add cross-references if agents complement each other

**Example**:
```markdown
**security-reviewer.md**:
- Purpose: Review specific code for vulnerabilities
- When: Reviewing specific endpoints/features

**security-expert.md** (in experts/):
- Purpose: Answer security questions, provide guidance
- When: Questions about security patterns/best practices
```

#### Strategy 3: Keep Separate with Clear Boundaries

**When**: Agents serve different user needs despite similar domains

**Process**:
1. Document clear boundary in each agent's description
2. Add "When NOT to use this agent" section
3. Reference complementary agent in each

### Fix Procedure

1. **Analyze overlap**:
   ```bash
   Read .claude/agents/agent-a.md
   Read .claude/agents/agent-b.md
   # Compare: purpose, tools, typical tasks
   ```

2. **Choose strategy** based on overlap percentage

3. **Execute strategy** and update documentation

4. **Verify no broken references**:
   ```bash
   grep "agent-b" CLAUDE.md
   grep "agent-b" .claude/agents/*.md
   ```

---

## <a id="stale-agent-patterns"></a>Stale Agent Patterns

**Trigger**: Agent references deprecated files or patterns
**Severity**: 🟡 MEDIUM (functionality risk)

### Common Stale Patterns

#### Pattern 1: References to Removed Files

**Detection**:
```bash
# Agent mentions file that doesn't exist
grep "docs/OLD_FILE.md" .claude/agents/agent-name.md
```

**Fix**: Update references to current file structure

#### Pattern 2: Deprecated Code Patterns

**Example**: Agent shows `db.query()` instead of `select()`

**Fix**:
```markdown
# ❌ OLD: Don't show this
db.query(Model).filter(...)

# ✅ CURRENT: Show this
from sqlalchemy import select
stmt = select(Model).where(...)
```

#### Pattern 3: Outdated Conventions

**Example**: Agent doesn't mention new coordinator pattern

**Fix**: Update agent to reference current architecture

### Fix Procedure

1. **Identify outdated references**:
   - Check file paths exist
   - Verify code examples match current patterns
   - Confirm conventions align with CLAUDE.md

2. **Update references** to current equivalents

3. **Test agent logic** still makes sense with updates

---

## <a id="meta-antipattern-detection"></a>Meta-Antipattern: Solution in Agent

**Trigger**: Agent contains detailed "how to fix" procedures
**Severity**: 🔴 HIGH (violates Single Source of Truth)

### Expected Architecture

**Agents** (.claude/agents/):
- WHAT to detect (antipatterns, metrics)
- HOW to detect (bash commands, thresholds)
- WHEN to load which section
- Decision logic

**Conventions** (.claude/conventions/):
- HOW to fix each problem
- Detailed refactoring steps
- Code examples and templates
- Best practices

### Detection Criteria

**Red flags in agent files**:
- Sections with titles like "Fix Procedure", "How to Correct", "Solution Steps"
- Code blocks showing "before" and "after" examples
- Detailed numbered procedures (>10 steps)
- Templates for corrected code

**Red flags in conventions files**:
- Bash commands for detection (`grep`, `find`, `wc -l`)
- Conditional logic ("if X then Y")
- Threshold definitions ("if >500 lines")
- Validation commands

### Fix Procedure

#### If Solution in Agent:

1. **Identify solution sections**:
   ```bash
   Read .claude/agents/agent-name.md
   # Look for: "Fix", "Solution", "How to", detailed procedures
   ```

2. **Extract to conventions**:
   - Create section in corresponding conventions file
   - Add HTML anchor
   - Move all "how to fix" content

3. **Update agent to load solution**:
   ```markdown
   **When [problem] detected**:
   - Load: `Task(subagent_type="doc-retriever", prompt="document: .claude/conventions/..., section: Problem Fix")`
   ```

#### If Detection in Conventions:

1. **Identify detection logic**:
   ```bash
   Read .claude/conventions/convention-name.md
   # Look for: bash commands, thresholds, grep patterns
   ```

2. **Move to agent**:
   - Add to agent's detection section
   - Keep conventions focused on solutions

3. **Verify separation**:
   - Agent: Detection + orchestration
   - Conventions: Solutions + knowledge

### Example Refactoring

**Before** (solution in agent):
```markdown
### Problem: Agent too large

**How to fix**:
1. Create conventions file
2. Extract knowledge sections
3. Add HTML anchors
4. [20 more detailed steps...]
```

**After** (load from conventions):
```markdown
### 5. Oversized Agent Detection

**Check for**:
- Agents with >500 lines

**When detected**:
- Load: `Task(subagent_type="doc-retriever", prompt="document: .claude/conventions/agent-maintenance-guide.md, section: Oversized Agent Refactoring")`
```

---

## <a id="meta-antipattern-detection-in-conventions"></a>Meta-Antipattern: Detection in Conventions

**Trigger**: Conventions file contains detection logic
**Severity**: 🟡 MEDIUM (architectural confusion)

### Fix Procedure

Move detection logic to agent:

**From conventions**:
```markdown
## Problem Detection

Check for oversized agents:
```bash
find .claude/agents -name "*.md" -exec wc -l {} \;
```

If >500 lines → Problem
```

**To agent**:
```markdown
### 5. Oversized Agent Detection

```bash
find .claude/agents -name "*.md" -exec wc -l {} \;
```

**Threshold**: >500 lines

**When detected**:
- Load refactoring guide from conventions
```

---

## <a id="incorrect-permission-mode"></a>Incorrect Permission Mode

**Trigger**: Agent with `acceptEdits` without clear justification
**Severity**: 🟡 MEDIUM (safety)

### Permission Mode Guidelines

**`default`** (most agents):
- Requires user approval for edits
- Safer for production
- Better for learning (user sees changes)

**`acceptEdits`** (rare):
- Only for highly automated tasks
- Agent autonomously applies fixes
- Examples: test-runner (applies lint fixes)

### Fix Procedure

1. **Analyze agent's edit pattern**:
   - Does it make potentially breaking changes?
   - Should user review before applying?

2. **Default to `default` unless**:
   - Agent applies mechanical fixes (lint, format)
   - Changes are easily reversible
   - User explicitly wants automation

3. **Update front matter**:
   ```markdown
   ---
   permissionMode: default  # Changed from acceptEdits
   ---
   ```

---

## Quick Reference: Common Fixes

| Problem | Severity | Fix Document Section |
|---------|----------|---------------------|
| Agent >500 lines | 🟡 MEDIUM | [Oversized Agent Refactoring](#oversized-agent-refactoring) |
| Missing Spanish directive | 🔴 HIGH | [Missing Spanish Directive](#missing-spanish-directive) |
| Instructions in Spanish | 🟡 MEDIUM | [Instructions in Spanish](#instructions-in-spanish) |
| Wrong model (Sonnet vs Haiku) | 🟢 LOW | [Incorrect Model Selection](#incorrect-model-selection) |
| Too many tools | 🟡 MEDIUM | [Excessive Tool Permissions](#excessive-tool-permissions) |
| Not in CLAUDE.md | 🟡 MEDIUM | [Missing Documentation](#missing-documentation-in-claudemd) |
| Duplicate agent | 🔴 HIGH | [Duplicate Agent Functionality](#duplicate-agent-functionality) |
| Outdated references | 🟡 MEDIUM | [Stale Agent Patterns](#stale-agent-patterns) |
| Solution in agent | 🔴 HIGH | [Meta-Antipattern: Solution in Agent](#meta-antipattern-detection) |
| Detection in conventions | 🟡 MEDIUM | [Meta-Antipattern: Detection in Conventions](#meta-antipattern-detection-in-conventions) |
| Wrong permission mode | 🟡 MEDIUM | [Incorrect Permission Mode](#incorrect-permission-mode) |

---

**Remember**: This guide contains SOLUTIONS (how to fix). Detection logic (what to check, bash commands, thresholds) lives in `.claude/agents/agents-maintainer.md`.
