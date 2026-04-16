# Permissions Matrix

## Purpose

This document defines the **authorization model** used by CourseFlow.

The system uses a **role-based permission model** combined with **resource state**.

Permissions depend on three dimensions:

1. **Resource type**
2. **Resource status**
3. **User role relative to the resource**

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

### Graph

Represents an instructional graph authored within a project.

Each resource type has **its own permission matrix**.

---

# Resource Status

Permissions vary depending on the lifecycle status of the resource.

Typical project states include:

- **Draft**
- **Published**
- **Archived**

Typical graph states include:

- **Draft**
- **Published**
- **Archived**

These states determine whether editing or publishing operations are allowed.

---

# Roles

Users interact with resources under a role.

Roles differ depending on whether the resource is a **project** or a **graph**.

## Project Roles

Typical project roles include:

| Role | Meaning |
|-----|------|
| Owner | Full administrative control |
| Editor | Can modify project content |
| Commenter | Can comment but not edit |
| Viewer | Read-only access |
| Anonymous | Public / unauthenticated user |

Additional organizational roles may include:

| Role | Meaning |
|-----|------|
| Lead | Organization-level project owner |
| Member | Organization member |
| Third Party | External collaborator |

---

## Graph Roles

Graph permissions are usually derived from **project membership** but may have additional rules depending on graph ownership.

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

Typical graph-level actions include:

| Action | Description |
|------|------|
| View graph | Open graph |
| Edit graph | Modify graph structure |
| Create graph | Create new graph |
| Delete graph | Remove graph |
| Publish graph | Publish graph |
| Duplicate graph | Clone graph |

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

| Action | Draft Owner | Draft Editor | Draft Viewer | Published Owner | Published Viewer |
|------|------|------|------|------|------|
| View | X | X | X | X | X |
| Edit | X | X | | X | |
| Delete | X | | | X | |
| Publish | X | | | | |

This means:

- owners can perform all actions
- editors can modify drafts
- viewers can only read
- publishing is restricted

---

# Enforcement Locations

Permission enforcement occurs in multiple layers.

## Backend

Primary enforcement layer.

Typical enforcement points include:

- Django view permissions
- service layer mutation guards
- websocket connection authorization

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

---

# Relationship Between Project and Graph Permissions

Graph permissions usually inherit from **project membership**.

Typical rule:
```
GraphPermission = ProjectRole + GraphState
```


Examples:

- project owners can edit all graphs
- project editors can edit graphs
- viewers cannot modify graphs

However:

Publishing rules may be stricter.

---

# Implementation Guidance for Developers

When adding new actions:

1. Add the action to the permission matrix.
2. Implement backend authorization logic.
3. Mirror logic in frontend capability checks.

Avoid:

- duplicating permission rules across services
- embedding permissions inside UI components
- inferring permissions from partial data

Instead:

Create explicit permission helpers.

Example pattern:
```
can_edit_graph(user, graph)
can_publish_project(user, project)
can_delete_graph(user, graph)
```


These helpers should encode the matrix logic.

---

# Implementation Guidance for Coding Agents

When modifying permission logic:

Always verify:

1. resource type
2. resource lifecycle state
3. user role relative to the resource

Never assume:

- editors can publish
- viewers can duplicate
- anonymous users can view unpublished resources

The permission matrix is the **single authoritative model** for allowed operations.

---

# Future Improvements

The spreadsheet permission matrix should eventually be:

- converted into machine-readable configuration
- validated by automated tests
- used to generate permission helper functions

This would allow:

- automated permission validation
- elimination of duplicated rules
- improved consistency between backend and frontend
