# Permissions Matrix

## Purpose

This document defines the **authorization model** used by CourseFlow.

The system combines one **account role**, one contextual **resource role**, and
the **resource state**.

Permissions depend on four dimensions:

1. **Resource type**
2. **Resource status**
3. **Account role**
4. **User role relative to the resource**

The permission matrix determines whether a user may perform a given **action** on a given **resource state**.

This document exists primarily to help:

- backend permission checks
- frontend UI enable/disable logic

---

# Core Concepts

## Resource Types

The system currently defines permission matrices for:

### Project

Represents a container for graphs and collaborators.

### Workflow

Represents an instructional workflow and its backing graph authored within a project.

Each resource type has **its own permission matrix**.

---

# Resource Status

Permissions vary depending on the lifecycle status of the resource.

Project and workflow states are:

- **Private**
- **Public**
- **Archived**

These states determine whether editing or publishing operations are allowed.

---

# Roles

Every non-superuser has exactly one account role, stored as one canonical Django
`auth.Group` membership:

| Account role | Meaning |
|-----|------|
| Admin | Global authorization override |
| Teacher | Normal account; resource access still requires ownership, membership, or public visibility |
| Student | Normal account; default at registration; resource access still requires ownership, membership, or public visibility |

Multiple or missing canonical account-role groups are invalid and authorization
fails closed. Django superusers resolve to Admin. Teacher and Student do not grant
access to arbitrary projects or workflows.

Users then interact with each resource under a separate contextual role.

The contextual role is resolved from ownership, project TeamUser membership, or
public project visibility.

## Project Roles

Typical project roles include:

| Role | Meaning |
|-----|------|
| Owner | Full administrative control |
| Editor | Can modify project content |
| Commenter | Can comment but not edit |
| Viewer | Read-only access |
| Public | Authenticated non-contributor accessing a public project |

Organization-level roles are deferred and are not part of the current evaluator.
Possible future roles include:

| Role | Meaning |
|-----|------|
| Lead | Organization-level project owner |
| Member | Organization member |
| Third Party | External collaborator |

---

## Workflow Roles

Workflow permissions inherit **project membership**. The workflow author and project
owner resolve to owner; other contributors inherit their project TeamUser role.

---

# Permission Model

Permissions are defined as a **matrix of actions vs roles vs resource state**.

Conceptually: Permission = f(Action, Role, ResourceState)



Where:

- **Action** = attempted operation
- **Role** = user role relative to the resource
- **ResourceState** = lifecycle status

If the matrix cell is allowed, the action succeeds.

If not, the system must deny the request.

---

# Common Actions

Typical project-level actions include:

| Action | Description |
|------|------|
| View project | Access project metadata |
| Edit project | Modify project properties |
| Delete project | Remove project |
| Publish project | Transition project to published state |
| Archive project | Move project to archived state |
| Manage collaborators | Add/remove members |

Typical workflow-level actions include:

| Action | Description |
|------|------|
| View workflow | Open the workflow workspace |
| Edit attributes | Modify workflow metadata |
| Archive workflow | Move a workflow to archived state |
| Restore workflow | Restore an individually archived workflow |
| Delete permanently | Irrecoverably remove an archived workflow |
| Node/part/category/link/outcome management | Modify workflow graph content |
| Comment | Add a workflow comment |
| Delete own comment | Delete only a comment authored by the current user |

---

# Matrix Interpretation

The spreadsheet encodes permissions using **X markers**.

Meaning:
```
X = action allowed
(empty) = action denied
```


Columns represent roles under different **resource states**.

Example conceptual structure:

| Action | Private Owner | Private Editor | Private Viewer | Public Owner | Public Viewer |
|------|------|------|------|------|------|
| View | X | X | X | X | X |
| Edit | X | X | | X | |
| Archive | X | | | X | |
| Publish/unpublish | X | X | | X | |

This means:

- owners can perform all actions
- editors can modify drafts
- viewers can only read
- project publishing is available to owners and editors

---

# Enforcement Locations

Permission enforcement occurs in multiple layers.

## Backend

Primary enforcement layer.

Enforcement points include:

- Django Ninja controllers for reads and ordinary mutations
- application services for graph and lifecycle mutations
- contextual capability generation on API responses

Backend must be treated as **authoritative**.

---

## Frontend

Frontend uses the matrix to:

- hide or disable UI controls
- prevent impossible user actions
- reduce unnecessary API calls

However:

Frontend checks are **not authoritative**.

Backend must always enforce permissions.

Project, workflow, graph-view, and library item responses expose the evaluated
context as:

```json
{
  "accountRole": "student",
  "resourceRole": "editor",
  "state": "private",
  "actions": ["comment", "edit_attributes", "view"],
  "adminOverride": false
}
```

The frontend must consume `actions`; it must not reconstruct the matrix from
`accountRole` or `resourceRole`.

---

# Relationship Between Project and Workflow Permissions

Workflow permissions inherit from **project membership**.

Resolution rule:
```
WorkflowPermission = ProjectRole + WorkflowState
```


Examples:

- project owners can edit all workflows
- project editors can edit workflows
- viewers cannot modify workflows

However:

Project publication is inherited by child workflows; workflows do not have an
independent published flag.

Archived resources are not browsable through normal workspace endpoints. The
owner receives only restore and permanent-delete capabilities in archived list
contexts. Editors, commenters, viewers, and public users receive no archived
actions.

Comment deletion has no moderation override: owners, editors, and commenters may
delete only comments they authored.

---

# Implementation Guidance for Developers

When adding new actions:

1. Add the action to the permission matrix.
2. Implement backend authorization logic.
3. Expose the action through the backend permission context and consume that
   capability in the frontend.

Avoid:

- duplicating permission rules across services
- embedding permissions inside UI components
- inferring permissions from partial data

Instead:

Create explicit permission helpers.

Example pattern:
```
permissions_for(user, resource)
require(user, action, resource)
```


The contextual evaluator returns the complete allowed action set. Do not create a
new function for every action.

---

# Implementation Guidance for Coding Agents

When modifying permission logic:

Always verify:

1. resource type
2. resource lifecycle state
3. user role relative to the resource

Do not assume:

- account role alone grants resource access
- public users can copy or export workflows
- public users can view private or archived resources

The permission matrix is the **single authoritative model** for allowed operations.

---

# Future Improvements

The current executable matrices live in `course_flow/core/permissions.py` and
are exercised by authorization service and endpoint tests. The YAML files in
this directory are the human-readable policy mirror. Changes must update both
surfaces in the same change.
