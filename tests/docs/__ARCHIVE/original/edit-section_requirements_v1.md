# CourseFlow 2.0 - Workflow - Edit Section

## Designs


| ID                   | Frame name (Figma)                          | `node-id`     | Link                                                                                                                         |
| -------------------- | ------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `FIGMA-SEC-OE-EDIT`  | edit section / owners and editors           | `4193-42498`  | [Open in Figma](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=4193-42498&t=vePHPw4PnV3f9k8W-1)  |
| `FIGMA-SEC-CV-EDIT`  | edit section / commenters and viewers       | `6353-89504`  | [Open in Figma](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=6353-89504&t=vePHPw4PnV3f9k8W-1)  |
| `FIGMA-SEC-OE-HOVER` | hovered section / owners and editors        | `1937-24543`  | [Open in Figma](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=1937-24543&t=vePHPw4PnV3f9k8W-1)  |
| `FIGMA-SEC-C-HOVER`  | hovered section / commenters                | `6354-91198`  | [Open in Figma](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=6354-91198&t=vePHPw4PnV3f9k8W-1)  |
| `FIGMA-SEC-DEL-WARN` | edit section / delete warning               | `5661-46139`  | [Open in Figma](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=5661-46139&t=vePHPw4PnV3f9k8W-1)  |
| `FIGMA-SEC-COM-OE`   | comments tab active / owners and editors | `6355-92135`  | [Open in Figma](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=6355-92135&t=vePHPw4PnV3f9k8W-1)  |
| `FIGMA-SEC-COM-C`    | comments tab active / commenters         | `6355-99730`  | [Open in Figma](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=6355-99730&t=vePHPw4PnV3f9k8W-1)  |
| `FIGMA-SEC-COM-V`    | comments tab active / viewers            | `6355-100291` | [Open in Figma](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=6355-100291&t=vePHPw4PnV3f9k8W-1) |


## Entities

- Section: ordered container in a Workflow which can contain Nodes.

## Prerequisites Section FRs

- User is authentified to the CourseFlow application
- User has nativated to a Workflow on which he has Viewer, Commenter, Editor or Owner role

## Functional Requirements

### FR-SEC-001 Open Edit Section Form

- **Design evidence**: `FIGMA-SEC-OE-EDIT` (Owner/Editor), `FIGMA-SEC-CV-EDIT` (Commenter/Viewer).
- **Actor**: 
  - Owner
  - Editor
  - Viewer (may open the sidebar in read-only mode)
  - Commenter (may open the sidebar in read-only mode)
- **Preconditions**: Workflow is open in [Workflow] view, at least one Section exists.
- **Trigger**:
  1. User clicks an existing Section, or
  2. User already has the [Right sidebar] opened and clicks on [Section header] (Section above the separator between Section header and node area)
- **Main Flow**:
  1. System opens the [Right sidebar] with the [Edit section] form
  2. [Right sidebar] content updates to show the [Edit section] form
- **Acceptance Criteria**:
  - Given the [Right sidebar] is already open, when user clicks [Section header], then [Right sidebar] changes to shows the [Edit section] form for that Section.
  - Given the [Right sidebar] is not open, when the user clicks on [Section header], then the [Right sidebar] opens and shows the [Edit section] form for that Section.

### FR-SEC-002 Section Numbering And Display

- **Design evidence**: `FIGMA-SEC-OE-EDIT`, `FIGMA-SEC-OE-HOVER`, `FIGMA-SEC-C-HOVER`.
- **Actor**: System.
- **Preconditions**: Workflow contains 1..N Sections.
- **Trigger**: Any Section create/insert/delete/reorder operation completes.
- **Main Flow**:
  1. System recalculates Section numbers top-to-bottom (starting at 1).
  2. System always shows the Section number, without requiring hover.
  3. If the [Title] field of the [Edit section] is filled, system shows number and content of [Title] field on [Section header]; if [Title] field is empty, system shows number only (no placeholder) on [Section header]
- **Acceptance Criteria**:
  - When a Section is inserted between existing Section, then numbering updates so indices stay contiguous from top to bottom.
  - Given the [Title] field of the [Edit section] form is empty, only the number displays.

### FR-SEC-003 Edit Section Title (auto-save)

- **Design evidence**: `FIGMA-SEC-OE-EDIT`.
- **Actor**: 
  - Owner 
  - Editor
- **Preconditions**: the [Edit section] form is open; user has edit rights.
- **Trigger**: User types, pastes, or clears the title field.
- **Main Flow**:
  1. System enforces maximum 100 characters for stored [Title] (see FR-SEC-010).
  2. System auto-saves changes, there is no Save button on the form.
  3. [Section header] updates to reflect persisted title.
- **Acceptance Criteria**:
  - When changes are valid, then title persists without an explicit Save control and header updates accordingly.
  - Given [Title] is cleared, when auto-save completes, then Section shows number only (no placeholder).
  - Given Viewer or Commenter, when [Edit section] form is visible, then [Title] field is not editable (FR-SEC-007).

### FR-SEC-004 Insert Section Below (hover)

- **Design evidence**: `FIGMA-SEC-OE-HOVER`
- **Actor**: 
  - Owner
  - Editor
- **Preconditions**: Section exists; user has edit rights.
- **Trigger**: User clicks on the [Insert below] icon on hover of the [Section header].
- **Main Flow**:
  1. System inserts a new empty Section directly below the target Section.
  2. System renumbers sections.
- **Acceptance Criteria**:
  - Given Section at index K, when insert below action succeeds, then new Section is at K+1 and following indices shift.
  - Given Commenter role, the [Insert below] icon is visible but inactive on hover of [Section header]
  - Given Viewer role, no icon is visible on hover of [Section header]

### FR-SEC-005 Duplicate Section Below (hover or sidebar)

- **Design evidence**: `FIGMA-SEC-OE-HOVER` ([Duplicate] icon), `FIGMA-SEC-OE-EDIT` (same action from sidebar if present as control/button).
- **Actor**: 
  - Owner 
  - Editor
- **Preconditions**: At least one Section exists within the Workflow.
- **Trigger**: User clicks on the [Duplicate] icon on hover of [Section header] or on the [Duplicate] button from [Edit section] form in the [Right sidebar]
- **Main Flow**:
  1. System creates a copy of the Section below the source Section.
  2. System duplicates: Nodes, Node metas, associated Outcomes, linked Workflows, Edges.
  3. System does not duplicate comments.
  4. Copied Section title is generated by appending literal `(copy)` to the current source title:
    - if source is empty, result is `(copy)`
    - if source is `section`, result is `section (copy)`
    - if source is `section (copy)`, result is `section (copy) (copy)`
  5. System renumbers the Sections.
- **Acceptance Criteria**:
  - Content mirrored except comments; copied Section is placed immediately below the source Section.
  - Given Commenter role, the [Duplicate] icon is visible on hover of [Section header] but inactive and the [Duplicate] button is read-only in the [Edit section] form of the [Right sidebar].
  - Given Viewer role, no icon is visible on hover of [Section header] but and the [Duplicate] button is read-only in the [Edit section] form of the [Right sidebar].

### FR-SEC-006 Delete Section

- **Design evidence**: `FIGMA-SEC-OE-HOVER` (delete icon on hover), `FIGMA-SEC-OE-EDIT` (delete from sidebar), `FIGMA-SEC-DEL-WARN` (modal edit section / delete warning).
- **Actor**: 
  - Owner
  - Editor
- **Preconditions**: Target Section exists.
- **Trigger**: User clicks on the [Delete] icon from hover on [Section header] or the [Delete] button from [Edit section] form in the [Right sidebar]
- **Main Flow**:
  1. System opens the same delete [Delete section] modal for either entry path (`FIGMA-SEC-DEL-WARN`).
  2. Modal content (title, subtitle, button labels) is identical across locales.
  3. If user clicks on the [Cancel] button, system closes modal and workflow is unchanged (Section, Nodes, Edges, numbering unchanged).
  4. If user clicks on the [Delete section] button, system removes the Section and all contained content: nodes, edges, node metas, associated outcomes, linked workflows, comments; then renumbers remaining Sections.
- **Acceptance Criteria**:
  - Section is not deleted until [Delete section] button is clicked.
  - When [Cancel] button is clicked, modal closes, then no changes occur.
  - Given confirmed delete, when operation completes, then Section and listed content are gone and other Sections’ numbers reflect new order.

### FR-SEC-007 Permissions And Read-Only Presentation

- **Design evidence**: `FIGMA-SEC-OE-EDIT`, `FIGMA-SEC-CV-EDIT`, `FIGMA-SEC-OE-HOVER`, `FIGMA-SEC-C-HOVER`.
- **Actor**: 
  - System
  - Owner
  - Editor
  - Commenter
  - Viewer
- **Preconditions**: 
User has access to the Workflow.
- **Main Flow**:
  1. Owner and Editor roles: can view and click on icons when [Section header] is hovered ([Insert below], [Duplicate], [Delete], [Comment]); [Edit section] form fields are editable.
  2. Viewer role: can view Sections; Section hover icons are not visible; [Edit section] form fields are read-only; [Edit section] form buttons are disabled.
  3. Commenter role: may view and comment on Sections (FR-SEC-011); on hover of [Section header], all icons are visible but only the [Comment] icon is active; the [Edit section] form fields are read-only; the [Edit section] form buttons are disabled.
- **Acceptance Criteria**:
  - Given Viewer role, icons are not displayed on hover of [Section header].
  - Given Owner/Editor role, when hovering [Section header], then all four icons are clickable.
  - Given Commenter role, when hovering [Section header], then all four icons are are visible, but only [Comment] icon is clickable.
  - Given Viewer or Commenter role, when [Edit section] form is open in the [Right sidebar], then [Title] field is read-only and buttons are disabled.

### FR-SEC-008 Data Integrity For Edges Across Section Changes

- **Actor**: System.
- **Preconditions**: Workflow contains inter-section edges (edges which link a Nodes of different Sections)
- **Trigger**: Section insert/reorder/delete/duplicate operations occur.
- **Main Flow**: System applies global edge rules (preservation on insert/reorder/duplicate; delete removes incident edges with nodes).
- **Acceptance Criteria**:
  - Given Section insertion between two Sections which had linked Nodes, when insert completes, then existing cross-section edges remain.
  - Given confirmed Section delete, when Section Nodes deleted, then all edges originating or targeting the Section Nodes are deleted.

### FR-SEC-09 Section Title Validation (100 characters)

- **Design evidence**: `FIGMA-SEC-OE-EDIT` (error state if shown).
- **Actor**: 
  - System
  - Owner
  - Editor
- **Preconditions**: User edits the [Title] field of the [Edit section] form
- **Trigger**: Input would exceed or violates constraints.
- **Main Flow**:
  1. System prevents more than 100 characters in the stored [Title] (by blocking extra input).
  2. No Save button; validation is continuous or on attempted input past limit.
- **Acceptance Criteria**:
  - Given [Title] at 100 characters, when user attempts further input, then no additional characters are stored (or equivalent design-safe behavior).
  - Given [Title] under limit, when user edits, then auto-save may proceed per FR-SEC-003.

### FR-SEC-010 Comment On Section (hover icon)

- **Design evidence**: `FIGMA-SEC-C-HOVER` (commenter hover icon behavior), `FIGMA-SEC-OE-HOVER` (owner/editor hover set), `FIGMA-SEC-COM-OE` / `FIGMA-SEC-COM-C` / `FIGMA-SEC-COM-V` (comments tab active by role).
- **Actor**: 
  - Owner
  - Editor
  - Commenter
  - Viewer
- **Preconditions**: User has comment rights on the Workflow.
- **Trigger**: User clicks on the [Comment icon] on hover of [Section header]
- **Main Flow**:
  1. User clicks on the [Comment] icon.
  2. The [Comments] tab is selected in the [Right sidebar].
  3. Role capabilities in that tab follow product commenting permissions (create/reply/edit/delete as applicable).
- **Acceptance Criteria**:
  - Given Owner/Editor role, when comments are opened, then UI matches `FIGMA-SEC-COM-OE`.
  - Given Commenter role, when comments are opened, then UI matches `FIGMA-SEC-COM-C`.
  - Given Viewer role, when comments are opened via allowed entry path, then UI matches `FIGMA-SEC-COM-V`.

## Traceability To Figma


| Requirement ID | Frame name(s)                                                    | Design evidence ID(s)                                                                               | Link(s)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-SEC-001     | edit section / owners-editors; edit section / commenters-viewers | `FIGMA-SEC-OE-EDIT`, `FIGMA-SEC-CV-EDIT`                                                            | [OE Edit](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=4193-42498&t=vePHPw4PnV3f9k8W-1) · [CV Edit](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=6353-89504&t=vePHPw4PnV3f9k8W-1)                                                                                                                                                                                                                                                                                                                                                                      |
| FR-SEC-002     | edit + hover across roles (except viewer hover)                  | `FIGMA-SEC-OE-EDIT`, `FIGMA-SEC-OE-HOVER`, `FIGMA-SEC-C-HOVER`                                      | [OE Edit](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=4193-42498&t=vePHPw4PnV3f9k8W-1) · [OE Hover](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=1937-24543&t=vePHPw4PnV3f9k8W-1) · [C Hover](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=6354-91198&t=vePHPw4PnV3f9k8W-1)                                                                                                                                                                                                                                             |
| FR-SEC-003     | edit section / owners and editors                                | `FIGMA-SEC-OE-EDIT`                                                                                 | [OE Edit](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=4193-42498&t=vePHPw4PnV3f9k8W-1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| FR-SEC-004     | hovered section / owners and editors                             | `FIGMA-SEC-OE-HOVER`                                                                                | [OE Hover](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=1937-24543&t=vePHPw4PnV3f9k8W-1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| FR-SEC-005     | hovered OE; edit OE                                              | `FIGMA-SEC-OE-HOVER`, `FIGMA-SEC-OE-EDIT`                                                           | [OE Hover](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=1937-24543&t=vePHPw4PnV3f9k8W-1) · [OE Edit](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=4193-42498&t=vePHPw4PnV3f9k8W-1)                                                                                                                                                                                                                                                                                                                                                                     |
| FR-SEC-006     | hovered OE; modal delete warning; edit OE                        | `FIGMA-SEC-OE-HOVER`, `FIGMA-SEC-DEL-WARN`, `FIGMA-SEC-OE-EDIT`                                     | [OE Hover](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=1937-24543&t=vePHPw4PnV3f9k8W-1) · [Delete Warning](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=5661-46139&t=vePHPw4PnV3f9k8W-1) · [OE Edit](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=4193-42498&t=vePHPw4PnV3f9k8W-1)                                                                                                                                                                                                                                      |
| FR-SEC-007     | role variants in edit + hover                                    | `FIGMA-SEC-OE-EDIT`, `FIGMA-SEC-CV-EDIT`, `FIGMA-SEC-OE-HOVER`, `FIGMA-SEC-C-HOVER`                 | [OE Edit](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=4193-42498&t=vePHPw4PnV3f9k8W-1) · [CV Edit](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=6353-89504&t=vePHPw4PnV3f9k8W-1) · [OE Hover](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=1937-24543&t=vePHPw4PnV3f9k8W-1) · [C Hover](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=6354-91198&t=vePHPw4PnV3f9k8W-1)                                                                                                                     |
| FR-SEC-008     | —                                                                | *(doc / implementation)*                                                                            | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| FR-SEC-010     | edit section / owners and editors                                | `FIGMA-SEC-OE-EDIT`                                                                                 | [OE Edit](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=4193-42498&t=vePHPw4PnV3f9k8W-1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| FR-SEC-011     | hover entry + comments-tab views by role                         | `FIGMA-SEC-C-HOVER`, `FIGMA-SEC-OE-HOVER`, `FIGMA-SEC-COM-OE`, `FIGMA-SEC-COM-C`, `FIGMA-SEC-COM-V` | [C Hover](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=6354-91198&t=vePHPw4PnV3f9k8W-1) · [OE Hover](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=1937-24543&t=vePHPw4PnV3f9k8W-1) · [Com OE](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=6355-92135&t=vePHPw4PnV3f9k8W-1) · [Com C](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=6355-99730&t=vePHPw4PnV3f9k8W-1) · [Com V](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=6355-100291&t=vePHPw4PnV3f9k8W-1) |


