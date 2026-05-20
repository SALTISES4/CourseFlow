# Guidelines: Writing Functional Requirements (AI-Ready)

This document distills patterns from comparing `Edit-Section_AI-Ready_Requirements_backup.md` with the corrected `Edit-Section_AI-Ready_Requirements_v1.md`. Use it when authoring or reviewing functional requirements so specs stay testable, unambiguous, and scoped to **what the product must do**, not **how engineering implements it** unless that is an explicit product decision.

---

## 1. Define scope: functional vs non-functional vs out of scope

- Functional requirements describe observable behavior: user actions, system responses, permissions, data rules, and UI states that can be verified against design and acceptance tests.
- Non-functional or implementation mechanics (debounce intervals, optimistic UI vs server acknowledgment, offline/sync strategy) belong in architecture, engineering specs, or a separate NFR document—unless stakeholders have agreed they are product requirements with testable acceptance criteria.
- When you exclude implementation mechanics, say so explicitly in Assumptions or Scope (e.g. “This document does not specify …”) and remove related requirement IDs, traceability rows, and tests so the doc does not contradict itself.

---

## 2. One requirement, one coherent story; avoid duplicate acceptance criteria

- If two requirements repeat the same Given / When / Then for the same role and surface, consolidate into the requirement that owns that behavior (often permissions / read-only presentation) and reference it from others with a requirement ID.
- Removing duplication reduces drift when copy changes and keeps test catalogs aligned with a single source of truth.

---

## 3. Use stable IDs and structure for every FR

For each requirement, maintain a consistent skeleton:

| Element | Purpose |
| -------- | -------- |
| **Design evidence** | Stable IDs (e.g. `FIGMA-…`) linking to frames, not vague “see design.” |
| **Actor** | Who initiates or who the system acts on behalf of. |
| **Preconditions** | Minimum state before the trigger. |
| **Trigger** | Explicit user or system event. |
| **Main Flow** | Numbered steps; branch only when product diverges by role or path. |
| **Acceptance Criteria** | Testable **Given / When / Then** (or equivalent) that map to tests. |

---

## 4. Terminology: UI labels, roles, and disabled vs hidden

### Workflow hierarchy and nodes

Graph **workflowNodes** have two independent type dimensions; do not conflate them:

- **Parent workflow type** — the `workflow_type` of the workflow graph being edited (`program`, `course`, `activity`).
- **Node type** — the semantic child layer the cell represents (`course`, `activity`, `task`).

Avoid unqualified phrases such as “course node” or “activity node.” Prefer *parent workflow type is `course`*, *node type is `activity`*, or *workflowNode of node type `activity` in a course workflow*.

Full rules, link matrix, and legacy phrase mapping: [`terminology_workflow_hierarchy_and_nodes.md`](terminology_workflow_hierarchy_and_nodes.md) (implementation ADR: [`docs/architecture/adr_workflow_hierarchy_and_linked_nodes.md`](../../../docs/architecture/adr_workflow_hierarchy_and_linked_nodes.md)).

### UI labels, roles, and disabled vs hidden

- Use backticks for exact UI strings and control names (`Edit section`, `Delete section`) so they are searchable and unambiguous.
- Reserve bold for rare emphasis; overusing bold makes scans noisy.
- Align verbs with design: **hidden** vs **not hoverable** vs **visible but inactive** vs **read-only** vs **disabled**—these are different UX commitments; pick one per role and surface and reuse it in **Roles**, **Main Flow**, and **Acceptance Criteria**.
- **User actions — click, not “activate”:** Do not use **activate** / **activates** to mean a **click** on a control (button, link, icon, list row). Always write **click** (e.g. “User clicks [Home]”, “User clicks [Delete section]”). Use other precise verbs when the interaction is not a click (e.g. **types**, **drags**, **hovers**). For **system or UI state** after an interaction, prefer **selected**, **open**, or **visible** over “activated” (e.g. “The [Comments] tab is selected in the [Right sidebar]”).

---

## 5. Avoid speculative product caveats in FR text unless required

- Phrases like “subject to global feature flags” or “only these two placements carry this action per product” are useful only when validated; otherwise they add noise and untested scope.
- Prefer a clear Trigger and Main Flow; add constraints when PM/design explicitly lock them.

---

## 6. Traceability and tests must track the same scope

- Every `FR-*` in the traceability matrix should still exist in the body.
- If you remove a requirement, remove its Traceability row and any Functional Test rows that referenced it, and note the change in the Changelog.
- Starter test catalogs should reference the same Figma IDs and requirement IDs as the FRs they verify.

---

## 7. Changelog discipline

- Append a **Changelog** entry for each meaningful revision: scope changes, ID renames, merged or split requirements, and **out-of-scope** decisions.
- Version bumps (e.g. v1.7) help readers diff mentally against prior reviews and audits.

---

## 8. Open questions: separate living list or resolve into scope

- If **Open Validation Questions** duplicate what you have marked **out of scope**, you create ambiguity (are we answering these in this doc or not?).
- Either **resolve** questions into explicit scope (in or out) or maintain a **single** place—often product brief or backlog—for open items, not both an open-questions section and an out-of-scope section that say the same thing.

**Lesson from the edit:** The backup listed open questions on auto-save while also carrying an inferred FR; the corrected version chose explicit **out of scope** for those mechanics and removed the redundant open-questions block.

---

## Quick checklist before publishing

1. No `FR-*` describes implementation timing/transport unless product-owned and testable.  
2. Limitations distinguish environment limits from intentional spec gaps.  
3. Entities are minimal and necessary.  
4. No duplicate ACs across FRs for the same behavior.  
5. UI strings and roles are consistent; disabled/hidden/read-only wording matches design; user primary actions use **click**, not **activate**.  
6. Traceability matrix and test catalog match the requirement set.  
7. Changelog updated; obsolete requirements and tests removed.  
8. Workflow/node/link wording follows [`terminology_workflow_hierarchy_and_nodes.md`](terminology_workflow_hierarchy_and_nodes.md) (no ambiguous “course node” without parent vs node type).

---

*Derived from a diff review of `Edit-Section_AI-Ready_Requirements_backup.md` → `Edit-Section_AI-Ready_Requirements_v1.md` (CourseFlow 2.0 Edit Section workflow).*
