# ERD (derived from `course_flow/core/models`)

This diagram reflects the **current Django models**. Legacy names `UNIT` and favorite-workflow are removed; the academic object is **Workflow**, the projection container is **Graph**.

```mermaid
erDiagram
    USER ||--o{ PROJECT : owns
    USER ||--o{ WORKFLOW : author
    USER ||--o{ COMMENT : author
    USER ||--o{ NOTIFICATION : has
    USER ||--o{ FAVORITE_PROJECT : ""
    USER ||--o{ FAVORITE_GRAPH : ""
    USER ||--o{ TEAM_USER : ""
    USER ||--o{ AUTHTOKEN : ""

    PROJECT }o--o{ DISCIPLINE : projectdiscipline
    PROJECT ||--o{ TAG : ""
    PROJECT ||--|| TEAM : ""
    TEAM ||--o{ TEAM_USER : ""

    GRAPH ||--|| WORKFLOW : ""
    GRAPH ||--o{ SECTION : ""
    GRAPH ||--o{ CHANNEL : ""
    GRAPH ||--o{ OUTCOME : ""

    SECTION ||--o{ NODE : ""
    CHANNEL ||--o{ NODE : ""
    WORKFLOW ||--o{ NODE : ""

    NODE }o--o{ OUTCOME : nodeoutcome

    EDGE }o--|| NODE : source_node
    EDGE }o--|| NODE : target_node

    OUTCOME ||--o| OUTCOME : parent_child
    OUTCOME ||--|| THREAD : ""

    NODE ||--o| THREAD : ""
    CHANNEL ||--o| THREAD : ""
    SECTION ||--o| THREAD : ""

    THREAD ||--o{ COMMENT : ""

    HORIZONTALOUTCOME }o--o{ OUTCOME : horizontaloutcome_outcome

    WORKFLOW ||--o| PROGRAMMETA : ""
    WORKFLOW ||--o| COURSEMETA : ""
    WORKFLOW ||--o| ACTIVITYMETA : ""
    WORKFLOW ||--o| TASKMETA : ""
```

**Notes**

- `TEAM_USER` is the `TeamUser` model (`cf_team_user`); `TEAM` maps to `Team` (`cf_project_team`).
- `FAVORITE_GRAPH` references a **Graph** row (`cf_favorite_graph`).
- Outcome hierarchy uses a **self-FK** (`parent` / `children`) and `order`, not a separate outcome–outcome join table.
- `Graph` has **no** `Project` foreign key in the current ORM; cross-project scoping for graphs is not expressed in `Graph` itself.
