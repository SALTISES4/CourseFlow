# Serializer and DTO Contracts

## Purpose

This file documents the effective JSON contracts between Django serializers and the React frontend.

The important point is that the frontend frequently consumes:

- serializer outputs directly
- camel-cased versions of serializer field names
- assembled multi-serializer packages, not just single-resource DTOs

## Naming Convention

Backend serializer fields are mostly defined in snake_case.
Because camel-case middleware/utilities are present, the frontend often sees these as camelCase.

Examples:

- `created_on` -> `createdOn`
- `last_modified` -> `lastModified`
- `user_permissions` -> `userPermissions`
- `workflowproject_set` -> `workflowprojectSet`

Whenever adding backend fields, assume the frontend may receive them in camelCase.

---

## Common DTO: `UserSerializer`

Source:

```text
course_flow/serializers/user.py
```

Backend fields:

- `id`
- `username`
- `first_name`
- `last_name`
- `name`

Frontend shape:

```ts
type EUser = {
  id: number
  username: string
  firstName: string
  lastName: string
  name: string
  email?: string
  language?: string
}
```

Use this as the embedded user DTO in many other responses.

## Common DTO: `LibraryObjectSerializer`

Source:

```text
course_flow/serializers/workspace.py
```

Used by:

- library search
- favourites
- home page
- workflow chooser menus
- project/workflow cards
- duplication responses

Important fields:

- `id`
- `deleted`
- `created_on`
- `last_modified`
- `published`
- `type`
- `is_strategy`
- `is_template`
- `title`
- `description`
- `author`
- `favourite`
- `is_owned`
- `project_title`
- `object_permission`
- `workflow_count`
- `is_linked`

Frontend counterpart:

```ts
interface ELibraryObject {
  id: number
  deleted: boolean
  createdOn: string
  lastModified: string
  title: string
  description: string
  author: EUser
  favourite: boolean
  published: boolean
  type: LibraryObjectType
  isOwned: boolean
  isStrategy: boolean
  projectTitle: string
  objectPermission: {
    permissionType: number
    lastViewed: string | null
  }
  workflowCount: number
  isLinked: boolean
  isVisible: boolean
  isTemplate: boolean
}
```

Important contract note:
This serializer normalizes both `Project` and `Workflow` into one list-item shape.

## Project Detail DTO: `ProjectSerializerShallow`

Source:

```text
course_flow/serializers/project.py
```

Fields:

- `deleted`
- `deleted_on`
- `id`
- `title`
- `description`
- `author`
- `author_id`
- `published`
- `created_on`
- `is_template`
- `last_modified`
- `workflowproject_set`
- `disciplines`
- `type`
- `object_sets`
- `favourite`
- `user_permissions`

Important derived fields:

- `workflowproject_set` is a list of workflow-project link ids, filtered to non-deleted workflows and ordered by rank
- `object_sets` is emitted as inline object set dictionaries, not just ids
- `favourite` depends on current user context
- `user_permissions` is computed

Frontend counterpart:

```ts
interface EProject {
  author: EUser
  userPermissions: number
  favourite: boolean
  disciplines: number[]
  published: boolean
  type: "project"
  workflowprojectSet: number[]
}
```

Important note:
Frontend local formatting may reshape this again before rendering.

## Workflow Detail DTO: `WorkflowSerializerShallow`

Source:

```text
course_flow/serializers/workflow.py
```

Fields:

- `author`
- `code`
- `condensed`
- `created_on`
- `deleted`
- `deleted_on`
- `description`
- `edit_count`
- `favourite`
- `id`
- `importing`
- `is_original`
- `is_strategy`
- `is_template`
- `last_modified`
- `outcomes_sort`
- `outcomes_type`
- `parent_workflow`
- `ponderation_individual`
- `ponderation_practical`
- `ponderation_theory`
- `public_view`
- `published`
- `strategy_icon`
- `time_general_hours`
- `time_required`
- `time_specific_hours`
- `time_units`
- `title`
- `url`
- `user_permissions`
- `columns`
- `outcomes`
- `weeks`

Derived relation fields:

- `weeks` = ordered week ids
- `columns` = ordered column ids
- `outcomes` = ordered outcome ids

Additional notes:

- `url` is permission-aware
- `strategy_icon` is derived from first week of strategy workflows

Frontend counterpart:

```ts
interface EWorkflow {
  author: EUser
  userPermissions: number
  favourite: boolean
  published: boolean
  isOriginal: boolean
  isStrategy: boolean
  isTemplate: boolean
  type: WorkflowType
  publicView: boolean
  condensed: boolean
  importing: boolean
  code: string | null
  outcomesSort: number
  outcomesType: number
  parentWorkflow: number | null
  ponderationIndividual: number
  ponderationPractical: number
  ponderationTheory: number
  timeGeneralHours: number
  timeRequired: string | null
  timeSpecificHours: number
  timeUnits: number
  url: string
  editCount?: number
  weeks: number[]
  columns: number[]
  outcomes: number[]
}
```

Frontend transformation:

`useGetWorkflowByIdQuery` injects:

```ts
workflowPermissions: calcWorkflowPermissions(userPermissions)
```

## Workflow Object DTOs

### Column

Source:

```text
course_flow/serializers/container.py
```

Fields:

- `deleted`
- `deleted_on`
- `id`
- `title`
- `icon`
- `column_type`
- `column_type_display`
- `colour`
- `visible`
- `comments`

Frontend counterpart:

```ts
interface EColumn {
  colour: string | null
  columnType: number
  columnTypeDisplay: string
  icon: string | null
  visible: boolean
  comments: number[]
  order: number
}
```

### Week

Fields:

- `deleted`
- `deleted_on`
- `id`
- `title`
- `description`
- `default`
- `nodes`
- `week_type`
- `week_type_display`
- `is_strategy`
- `strategy_classification`
- `comments`
- `order`
- `is_dropped`

Important note:
`nodes` is a derived ordered list based on `NodeWeek.rank`.

### Node

Source:

```text
course_flow/serializers/node.py
```

Fields include:

- `deleted`
- `deleted_on`
- `id`
- `title`
- `description`
- `column`
- `columnworkflow`
- `context_classification`
- `task_classification`
- `outcomenode_set`
- `outcomenode_unique_set`
- `outgoing_links`
- `node_type`
- `node_type_display`
- `has_autolink`
- `time_units`
- `time_required`
- `ponderation_theory`
- `ponderation_practical`
- `ponderation_individual`
- `time_general_hours`
- `time_specific_hours`
- `represents_workflow`
- `linked_workflow`
- `linked_workflow_data`
- `is_dropped`
- `comments`
- `sets`
- `week`
- `order`

Important contract note:
`comments` are embedded full objects here, not ids. That is inconsistent with some other relation handling and is explicitly noted in code comments.

### NodeLink

Fields:

- `deleted`
- `deleted_on`
- `id`
- `title`
- `source_node`
- `target_node`
- `source_port`
- `target_port`
- `dashed`
- `text_position`

### Outcome

Source:

```text
course_flow/serializers/outcome.py
```

Fields:

- `deleted`
- `deleted_on`
- `id`
- `title`
- `code`
- `description`
- `child_outcome_links`
- `outcome_horizontal_links`
- `outcome_horizontal_links_unique`
- `depth`
- `type`
- `comments`
- `sets`

Important note:
Outcome DTOs represent a recursive tree flattened into:

- outcome records
- through-link records
- horizontal-link records

## Through-Model DTOs

These preserve ordering and graph relations.

### `WeekWorkflowSerializerShallow`

Fields:

- `workflow`
- `week`
- `rank`
- `id`
- `week_type`

### `ColumnWorkflowSerializerShallow`

Fields:

- `workflow`
- `column`
- `rank`
- `id`

### `OutcomeWorkflowSerializerShallow`

Fields:

- `workflow`
- `outcome`
- `rank`
- `id`

### `OutcomeOutcomeSerializerShallow`

Fields:

- `parent`
- `child`
- `rank`
- `id`

### `OutcomeNodeSerializerShallow`

Fields:

- `node`
- `outcome`
- `rank`
- `id`
- `degree`

### `NodeWeekSerializerShallow`

Fields:

- `week`
- `node`
- `rank`
- `id`

These relation DTOs are essential for ordering and graph reconstruction.

## Workflow Detail Package Contract

Source assembly:

```text
course_flow/services/workflow.py
WorkflowService.get_workflow_full()
```

### Always-present keys

For a workflow detail response, the backend builds at least:

```ts
{
  workflow,
  column,
  week,
  node,
  nodelink
}
```

### Additional keys for non-strategy workflows

If `workflow.is_strategy === false`, the package is extended with:

```ts
{
  outcomeworkflow,
  outcome,
  outcomeoutcome,
  outcomenode,
  strategy,
  saltise_strategy,
  project,
  tags
}
```

### Also present

```ts
{
  unread_comments
}
```

This package is the core editor contract.

### Practical frontend meaning

- `workflow` holds ordered ids for weeks/columns/outcomes
- object arrays hold the actual records
- selectors rebuild board/tree views from these pieces

## Parent / Child Workflow Packages

### Parent outcome package

Produced by:

```text
get_parent_outcome_data()
```

Keys:

- `parent_workflow`
- `outcomeworkflow`
- `parent_node`
- `outcomenode`
- `outcome`
- `outcomeoutcome`
- `outcomehorizontallink`

### Child outcome package

Produced by:

```text
get_child_outcome_data()
```

Keys:

- `node`
- `child_workflow`
- `outcomeworkflow`
- `outcome`
- `outcomeoutcome`
- `outcomehorizontallink`

These packages support alignment/related-workflow views rather than the main workflow grid.

## Library Search DTO

### Search request

```ts
{
  pagination?: { page: number }
  sort?: { direction: "ASC" | "DESC"; value: "DATE_CREATED" | "A_Z" | "DATE_MODIFIED" }
  filters?: Array<{ name: string; value: JSON }>
  resultsPerPage?: number
}
```

### Search response

```ts
{
  message: string
  dataPackage: {
    items: ELibraryObject[]
    meta: {
      currentPage: number
      count: number
      pageCount: number
    }
  }
}
```

Allowed filter names from serializer:

- `type`
- `discipline`
- `isTemplate`
- `isPublished`
- `keyword`
- `workspaceType`
- `parentProject`
- `project`

## Comments DTO

Comment serializer:

```text
course_flow/serializers/workflow_objects.py
```

Shape:

```ts
type EComment = {
  id: number
  user: EUser
  createdOn: string
  text: string
}
```

Comments list endpoint returns:

```ts
{
  message: string
  dataPackage: EComment[]
}
```

## Notifications DTO

Current frontend expectation:

```ts
type ENotification = {
  id: number
  type: WorkspaceType
  unread: boolean
  from: string
  text: string
  date: string
}
```

The frontend notification query also transforms each item by adding:

```ts
url: Utility.getPathByObject(item.id, item.type)
```

## Settings DTOs

### Profile settings GET

```ts
{
  message: string
  dataPackage: {
    firstName: string
    lastName: string
    language: "en" | "fr"
  }
}
```

### Notification settings GET

```ts
{
  message: string
  dataPackage: {
    receiveNotifications: boolean
  }
}
```

## Contract Preservation Rules

When adding or changing fields:

- update the backend serializer
- check camelCase field names expected in TS
- update `entity.ts` or query types
- update frontend marshalling code if present
- for workflow detail changes, verify Redux hydration still works

For the workflow editor, the package contract is more important than any individual serializer field.
