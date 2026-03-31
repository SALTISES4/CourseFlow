version: 1

meta:
  name: courseflow_vnext
  status: draft
  authoritative: true
  description: >
    Canonical source-of-truth schema for Courseflow vNext.
    This file is intended to be the primary model source for:
    - generated Mermaid ERDs
    - documentation packs
    - implementation planning
    - DTO / API contract derivation
  conventions:
    entity_keys: lowercase_singular
    relationship_cardinality_values:
      - one-to-one
      - one-to-many
      - many-to-one
      - many-to-many
    field_type_values:
      - int
      - uuid
      - string
      - text
      - wysiwyg
      - boolean
      - datetime
      - duration
      - enum
      - password
      - fk
      - join
      - derived
    nullability_policy: >
      Omitted `nullable` means unknown or not yet ratified.
      Omitted `required` means not yet ratified.
    writable_marker: >
      `writable: true` indicates the workbook explicitly marked the field as writeable
      or the field is clearly user-authored from surrounding context.
    source_priority:
      - canonical_yaml
      - mermaid_erd
      - fields_workbook

assumptions:
  - id: projectteam_member_alias
    status: provisional
    description: >
      Mermaid uses PROJECTTEAM_USER while the workbook uses projectteam_member.
      This YAML adopts `projectteam_member` as canonical and records `projectteam_user`
      as an alias.
  - id: unit_meta_polymorphism
    status: provisional
    description: >
      A unit has exactly one typed meta record matching unit_type, rather than all
      four meta records simultaneously.
  - id: workflow_unit_one_to_one
    status: provisional
    description: >
      Mermaid shows WORKFLOW ||--|| UNIT while workbook labels workflow.unit_fk as m:1.
      This YAML treats workflow <-> unit as one-to-one because that is the stronger
      and more plausible interpretation for the current design.
  - id: thread_attachment_model
    status: provisional
    description: >
      Thread appears to be a reusable comment container attachable one-to-one to
      channel, section, node, and outcome; comment belongs many-to-one to thread.
      Workbook also contains a suspicious thread.thread_fk row, which is ignored here.
  - id: outcome_self_relation
    status: provisional
    description: >
      Mermaid shows OUTCOME ||--o{ OUTCOME as an outcome link, while workbook models
      parentoutcome_fk as n:m. This YAML keeps the self-relationship as many-to-many
      until the real semantics are finalized.
  - id: node_section_channel_ownership
    status: provisional
    description: >
      Mermaid and workbook together imply node may belong to section and may also
      belong to channel. This may represent two parallel contexts rather than both
      being mandatory simultaneously.
  - id: user_workflow_join_unclear
    status: provisional
    description: >
      Workbook lists workflow.users as a join-style relationship, but Mermaid does not
      define a workflow-user collaboration join table. This is not modeled as canonical
      until a real join entity is defined.
  - id: notification_read_field
    status: provisional
    description: >
      Workbook has a 'read' row with missing machine name/type. This YAML normalizes it
      to `is_read: boolean`.
  - id: comment_uuid_name
    status: provisional
    description: >
      Workbook sometimes uses `hash` and sometimes `uuid`. This YAML normalizes all UUID
      identity fields to `uuid`.
  - id: common_field_inheritance
    status: provisional
    description: >
      Workbook includes a `common` tab but does not consistently apply inheritance.
      This YAML expands shared fields explicitly per entity where they appear to apply.

enums:
  unit_type:
    values:
      - program
      - course
      - activity
      - task
    description: Typed academic abstraction represented by unit.

  line_type:
    values: []
    description: >
      Placeholder enum from workbook (`LINE_TYPE`). Concrete values not yet provided.

  port_id:
    values: []
    description: >
      Placeholder enum from workbook (`PORT_ID`). Concrete values not yet provided.

entities:
  user:
    kind: entity
    aliases: []
    description: Authenticated platform user.
    fields:
      id:
        label: ID
        type: int
        required: true
        generated: true
      uuid:
        label: UUID
        type: uuid
        required: true
        generated: true
      first_name:
        label: First Name
        type: string
        writable: true
      last_name:
        label: Last Name
        type: string
        writable: true
      password:
        label: Password
        type: password
        writable: true
      email:
        label: Email
        type: string
        writable: true
    relationships:
      projects:
        target: project
        cardinality: one-to-many
        inverse_of: owner
        description: Projects owned by the user.
      workflows:
        target: workflow
        cardinality: one-to-many
        inverse_of: owner
        description: Workflows owned by the user.
      comments:
        target: comment
        cardinality: one-to-many
        inverse_of: owner
      notifications:
        target: notification
        cardinality: one-to-many
        inverse_of: user
      favorite_projects:
        target: favorite_project
        cardinality: one-to-many
        inverse_of: user
      favorite_workflows:
        target: favorite_workflow
        cardinality: one-to-many
        inverse_of: user
      projectteam_memberships:
        target: projectteam_member
        cardinality: one-to-many
        inverse_of: user

  project:
    kind: entity
    aliases: []
    description: Top-level owned workspace container for workflows.
    fields:
      id:
        label: ID
        type: int
        required: true
        generated: true
      uuid:
        label: UUID
        type: uuid
        required: true
        generated: true
      title:
        label: Title
        type: string
        writable: true
        max_length: 200
      modified_on:
        label: Last modified
        type: datetime
        comments: Used for sorting.
      date_created:
        label: Created on
        type: datetime
        comments: Displayed on thumbnail, used for sorting.
      is_published:
        label: Published
        type: boolean
        writable: true
        comments: Set by the user, determines if it displays in EXPLORE section.
      is_template:
        label: Is template
        type: boolean
        comments: Any super admin can toggle this flag on or off.
      description:
        label: Description
        type: wysiwyg
        writable: true
        comments: Filled by user.
    relationships:
      owner:
        target: user
        cardinality: many-to-one
        fk: user_fk
        required: true
      workflows:
        target: workflow
        cardinality: one-to-many
        inverse_of: project
      disciplines:
        target: discipline
        cardinality: many-to-many
        through: project_discipline
        writable: true
      favorite_links:
        target: favorite_project
        cardinality: one-to-many
        inverse_of: project
      team:
        target: projectteam
        cardinality: one-to-one
        inverse_of: project
      tags:
        target: tag
        cardinality: one-to-many
        inverse_of: project
      node_tags:
        target: node
        cardinality: none
        description: Not a direct relationship; tags attached to nodes remain project-scoped through tag.project.

  workflow:
    kind: entity
    aliases: []
    description: Structured academic flow contained optionally within a project.
    fields:
      id:
        label: ID
        type: int
        required: true
        generated: true
      uuid:
        label: UUID
        type: uuid
        required: true
        generated: true
      title:
        label: Title
        type: string
        writable: true
        max_length: 200
      modified_on:
        label: Last modified
        type: datetime
        comments: Used for sorting.
      date_created:
        label: Created on
        type: datetime
        comments: Displayed on thumbnail, used for sorting.
    relationships:
      owner:
        target: user
        cardinality: many-to-one
        fk: user_fk
        required: true
      project:
        target: project
        cardinality: many-to-one
        fk: project_fk
        required: false
      sections:
        target: section
        cardinality: one-to-many
        inverse_of: workflow
      channels:
        target: channel
        cardinality: one-to-many
        inverse_of: workflow
      unit:
        target: unit
        cardinality: one-to-one
        inverse_of: workflow
        required: true
      favorite_links:
        target: favorite_workflow
        cardinality: one-to-many
        inverse_of: workflow
      outcomes:
        target: outcome
        cardinality: one-to-many
        inverse_of: workflow

  unit:
    kind: entity
    aliases: []
    description: >
      Typed academic abstraction attached one-to-one to a workflow.
      A unit may represent program, course, activity, or task.
    fields:
      id:
        label: ID
        type: int
        required: true
        generated: true
      uuid:
        label: UUID
        type: uuid
        required: true
        generated: true
      title:
        label: Title
        type: string
        writable: true
        max_length: 200
      modified_on:
        label: Last modified
        type: datetime
        comments: Used for sorting.
      date_created:
        label: Created on
        type: datetime
        comments: Displayed on thumbnail, used for sorting.
      description:
        label: Description
        type: wysiwyg
        writable: true
        comments: Filled by user.
      unit_type:
        label: Type
        type: enum
        enum: unit_type
        comments: ACTIVITY | COURSE | PROGRAM | TASK
    relationships:
      workflow:
        target: workflow
        cardinality: one-to-one
        fk: workflow_fk
        required: true
      nodes:
        target: node
        cardinality: one-to-many
        inverse_of: unit
      programmeta:
        target: programmeta
        cardinality: one-to-one
        required: false
      coursemeta:
        target: coursemeta
        cardinality: one-to-one
        required: false
      activitymeta:
        target: activitymeta
        cardinality: one-to-one
        required: false
      taskmeta:
        target: taskmeta
        cardinality: one-to-one
        required: false

  section:
    kind: entity
    aliases: []
    description: Ordered structural grouping within a workflow.
    fields:
      id:
        label: ID
        type: int
        required: true
        generated: true
      uuid:
        label: UUID
        type: uuid
        required: true
        generated: true
      title:
        label: Title
        type: string
        writable: true
        max_length: 200
      modified_on:
        label: Last modified
        type: datetime
        comments: Used for sorting.
      date_created:
        label: Created on
        type: datetime
        comments: Displayed on thumbnail, used for sorting.
      position:
        label: Position
        type: int
        writable: true
        comments: User can reorder the section by drag and drop.
    relationships:
      workflow:
        target: workflow
        cardinality: many-to-one
        fk: workflow_fk
        required: true
      nodes:
        target: node
        cardinality: one-to-many
        inverse_of: section
      thread:
        target: thread
        cardinality: one-to-one
        fk: thread_fk
        required: false

  channel:
    kind: entity
    aliases: []
    description: Ordered workflow channel that can contain nodes and has an attached comment thread.
    fields:
      id:
        label: ID
        type: int
        required: true
        generated: true
      uuid:
        label: UUID
        type: uuid
        required: true
        generated: true
      title:
        label: Title
        type: string
        writable: true
        max_length: 200
      modified_on:
        label: Last modified
        type: datetime
        comments: Used for sorting.
      date_created:
        label: Created on
        type: datetime
        comments: Displayed on thumbnail, used for sorting.
      position:
        label: Position
        type: int
        writable: true
        comments: User can reorder the section by drag and drop.
    relationships:
      workflow:
        target: workflow
        cardinality: many-to-one
        fk: workflow_fk
        required: true
      nodes:
        target: node
        cardinality: one-to-many
        inverse_of: channel
      thread:
        target: thread
        cardinality: one-to-one
        fk: thread_fk
        required: false

  node:
    kind: entity
    aliases: []
    description: Graph/content node attached to section and/or channel, optionally linked to unit and outcomes.
    fields:
      id:
        label: ID
        type: int
        required: true
        generated: true
      uuid:
        label: UUID
        type: uuid
        required: true
        generated: true
    relationships:
      section:
        target: section
        cardinality: many-to-one
        fk: section_fk
        required: false
      channel:
        target: channel
        cardinality: many-to-one
        fk: channel_fk
        required: false
      unit:
        target: unit
        cardinality: many-to-one
        fk: unit_fk
        required: false
      thread:
        target: thread
        cardinality: one-to-one
        fk: thread_fk
        required: false
      outcomes:
        target: outcome
        cardinality: many-to-many
        through: node_outcome
      tags:
        target: tag
        cardinality: many-to-many
        through: node_tag
      outgoing_edges:
        target: edge
        cardinality: one-to-many
        inverse_of: source_node
      incoming_edges:
        target: edge
        cardinality: one-to-many
        inverse_of: target_node

  edge:
    kind: entity
    aliases: []
    description: Directed connection between two nodes.
    fields:
      line_type:
        label: Line Type
        type: enum
        enum: line_type
      target_port:
        label: Target Port
        type: enum
        enum: port_id
      source_port:
        label: Source Port
        type: enum
        enum: port_id
    relationships:
      source_node:
        target: node
        cardinality: many-to-one
        fk: sourcenode_fk
        required: true
      target_node:
        target: node
        cardinality: many-to-one
        fk: targetnode_fk
        required: true

  thread:
    kind: entity
    aliases: []
    description: Reusable comment-thread container attachable to one owning domain object.
    fields:
      id:
        label: ID
        type: int
        required: true
        generated: true
      uuid:
        label: UUID
        type: uuid
        required: true
        generated: true
      modified_on:
        label: Last modified
        type: datetime
        comments: Used for sorting.
      date_created:
        label: Created on
        type: datetime
        comments: Displayed on thumbnail, used for sorting.
    relationships:
      comments:
        target: comment
        cardinality: one-to-many
        inverse_of: thread
      outcome:
        target: outcome
        cardinality: one-to-one
        inverse_of: thread
        required: false
      channel:
        target: channel
        cardinality: one-to-one
        inverse_of: thread
        required: false
      node:
        target: node
        cardinality: one-to-one
        inverse_of: thread
        required: false
      section:
        target: section
        cardinality: one-to-one
        inverse_of: thread
        required: false

  comment:
    kind: entity
    aliases: []
    description: User-authored comment belonging to a thread.
    fields:
      id:
        label: ID
        type: int
        required: true
        generated: true
      uuid:
        label: UUID
        type: uuid
        required: true
        generated: true
      modified_on:
        label: Last modified
        type: datetime
        comments: Used for sorting.
      date_created:
        label: Created on
        type: datetime
        comments: Displayed on thumbnail, used for sorting.
      body:
        label: Body
        type: text
        writable: true
    relationships:
      owner:
        target: user
        cardinality: many-to-one
        fk: user_fk
        required: true
      thread:
        target: thread
        cardinality: many-to-one
        fk: thread_fk
        required: true

  outcome:
    kind: entity
    aliases: []
    description: Outcome object attachable to nodes, tags, threads, and horizontal links.
    fields: {}
    relationships:
      workflow:
        target: workflow
        cardinality: many-to-one
        fk: workflow_fk
        required: true
      thread:
        target: thread
        cardinality: one-to-one
        fk: thread_fk
        required: true
      nodes:
        target: node
        cardinality: many-to-many
        through: node_outcome
      tags:
        target: tag
        cardinality: many-to-many
        through: outcome_tag
      parent_outcomes:
        target: outcome
        cardinality: many-to-many
        through: outcome_outcome
        description: Provisional self-link relationship; exact semantics not yet ratified.
      horizontal_links:
        target: horizontaloutcome
        cardinality: many-to-many
        through: horizontaloutcome_outcome

  horizontaloutcome:
    kind: entity
    aliases:
      - horizontal_outcome
    description: Join-like grouping structure connecting outcomes horizontally.
    fields: {}
    relationships:
      outcomes:
        target: outcome
        cardinality: many-to-many
        through: horizontaloutcome_outcome

  discipline:
    kind: taxonomy
    aliases: []
    description: Project classification taxonomy.
    fields:
      id:
        label: ID
        type: int
        required: true
        generated: true
      label:
        label: Label
        type: string
        writable: true
      translation_plural:
        label: translation_plural
        type: string
        writable: true
    relationships:
      projects:
        target: project
        cardinality: many-to-many
        through: project_discipline
        writable: true

  tag:
    kind: taxonomy
    aliases: []
    description: Flat taxonomy scoped to a project and attachable to nodes and outcomes.
    fields:
      id:
        label: ID
        type: int
        required: true
        generated: true
      label:
        label: Label
        type: string
        writable: true
      translation_plural:
        label: translation_plural
        type: string
        writable: true
    relationships:
      project:
        target: project
        cardinality: many-to-one
        fk: project_fk
        required: true
      outcomes:
        target: outcome
        cardinality: many-to-many
        through: outcome_tag
      nodes:
        target: node
        cardinality: many-to-many
        through: node_tag

  notification:
    kind: entity
    aliases: []
    description: User notification record.
    fields:
      id:
        label: ID
        type: int
        required: true
        generated: true
      uuid:
        label: UUID
        type: uuid
        required: true
        generated: true
      message:
        label: Message
        type: string
        writable: true
      is_read:
        label: Read
        type: boolean
        writable: true
        comments: Normalized from incomplete workbook row.
      date_created:
        label: Created on
        type: datetime
        comments: Displayed on thumbnail, used for sorting.
    relationships:
      user:
        target: user
        cardinality: many-to-one
        fk: user_fk
        required: true

  favorite_project:
    kind: join
    aliases: []
    description: Join entity linking user and project for favorites.
    fields: {}
    relationships:
      user:
        target: user
        cardinality: many-to-one
        fk: user_fk
        required: true
      project:
        target: project
        cardinality: many-to-one
        fk: project_fk
        required: true

  favorite_workflow:
    kind: join
    aliases: []
    description: Join entity linking user and workflow for favorites.
    fields: {}
    relationships:
      user:
        target: user
        cardinality: many-to-one
        fk: user_fk
        required: true
      workflow:
        target: workflow
        cardinality: many-to-one
        fk: workflow_fk
        required: true

  projectteam:
    kind: entity
    aliases: []
    description: Per-project team container.
    fields:
      id:
        label: ID
        type: int
        required: true
        generated: true
      uuid:
        label: UUID
        type: uuid
        required: true
        generated: true
    relationships:
      project:
        target: project
        cardinality: one-to-one
        fk: project_fk
        required: true
      members:
        target: projectteam_member
        cardinality: one-to-many
        inverse_of: projectteam

  projectteam_member:
    kind: join
    aliases:
      - projectteam_user
    description: Join entity linking user into a project team.
    fields: {}
    relationships:
      user:
        target: user
        cardinality: many-to-one
        fk: user_fk
        required: true
      projectteam:
        target: projectteam
        cardinality: many-to-one
        fk: projectteam_fk
        required: true

  programmeta:
    kind: meta
    aliases: []
    description: Program-specific meta fields for a unit where unit_type = program.
    fields:
      calculate_time:
        type: derived
        comments: Applies to all workflow types, filled by user.
      calculate_credits:
        type: derived
        comments: Applies only to Programs, filled by user.
      calculate_ponderation:
        type: derived
        comments: Applies only to Programs.
      calculate_classification:
        type: derived
        comments: Applies only to Programs only, filled by user.
      classification_general_time:
        type: duration
        comments: Applies only to Programs only, filled by user or calculated automatically.
      classification_specific_time:
        type: duration
        comments: Applies only to Programs only, filled by user or calculated automatically.
    relationships:
      unit:
        target: unit
        cardinality: one-to-one
        required: true

  coursemeta:
    kind: meta
    aliases: []
    description: Course-specific meta fields for a unit where unit_type = course.
    fields:
      classification:
        type: string
      code:
        type: string
        comments: Applies only to Courses, filled by user.
    relationships:
      unit:
        target: unit
        cardinality: one-to-one
        required: true

  taskmeta:
    kind: meta
    aliases: []
    description: Task-specific meta fields for a unit where unit_type = task.
    fields:
      context:
        type: string
        writable: true
    relationships:
      unit:
        target: unit
        cardinality: one-to-one
        required: true

  activitymeta:
    kind: meta
    aliases: []
    description: Activity-specific meta fields for a unit where unit_type = activity.
    fields:
      context:
        type: string
        writable: true
      classification:
        type: string
        writable: true
    relationships:
      unit:
        target: unit
        cardinality: one-to-one
        required: true

joins:
  project_discipline:
    left: project
    right: discipline
    cardinality: many-to-many
    description: Associative relationship between project and discipline.

  node_tag:
    left: node
    right: tag
    cardinality: many-to-many
    description: Associative relationship between node and tag.

  outcome_tag:
    left: outcome
    right: tag
    cardinality: many-to-many
    description: Associative relationship between outcome and tag.

  node_outcome:
    left: node
    right: outcome
    cardinality: many-to-many
    description: Associative relationship between node and outcome.

  outcome_outcome:
    left: outcome
    right: outcome
    cardinality: many-to-many
    description: Provisional self-referential outcome linking model.

  horizontaloutcome_outcome:
    left: horizontaloutcome
    right: outcome
    cardinality: many-to-many
    description: Associative relationship for horizontal outcome grouping.

rules:
  - id: unit_requires_matching_meta
    status: provisional
    description: >
      A unit must have exactly one typed meta record matching unit_type:
      - program -> programmeta
      - course -> coursemeta
      - activity -> activitymeta
      - task -> taskmeta

  - id: unit_forbids_nonmatching_meta
    status: provisional
    description: >
      A unit must not have meta rows for types other than its own unit_type.

  - id: workflow_has_one_unit
    status: provisional
    description: >
      Each workflow must be attached to exactly one unit, and each unit belongs to exactly one workflow.

  - id: thread_single_owner
    status: provisional
    description: >
      A thread should be owned by exactly one of:
      - channel
      - section
      - node
      - outcome
      Thread must not simultaneously be attached as the canonical thread of multiple owner entities.

  - id: comment_belongs_to_thread
    status: ratified
    description: Every comment belongs to exactly one thread.

  - id: comment_owned_by_user
    status: ratified
    description: Every comment is authored by exactly one user.

  - id: tag_scoped_to_project
    status: provisional
    description: >
      Tags are project-scoped. Node-tag and outcome-tag associations must only reference tags
      belonging to the same project context as the owning content.

  - id: project_has_single_team_container
    status: provisional
    description: Each project has exactly one projectteam container.

  - id: projectteam_membership_is_join
    status: ratified
    description: Project team membership is modeled as a join entity between projectteam and user.

  - id: favorites_are_join_entities
    status: ratified
    description: >
      Project and workflow favorites are separate join entities rather than a generic polymorphic favorite table.

  - id: node_context_ownership
    status: provisional
    description: >
      A node may belong to a section, a channel, or both, depending on final graph/content rules.
      Minimum ownership constraints are not yet ratified.

  - id: outcome_self_links_unsettled
    status: provisional
    description: >
      Outcome-to-outcome relationship semantics are not finalized. Current model preserves the relation
      without asserting whether it is hierarchy, prerequisite, dependency, or generic link.

  - id: generated_mermaid_must_follow_yaml
    status: ratified
    description: Mermaid diagrams are derived views and must not override this YAML.

views:
  mermaid_generation:
    include_entities:
      - user
      - project
      - workflow
      - section
      - channel
      - node
      - edge
      - outcome
      - horizontaloutcome
      - thread
      - comment
      - unit
      - programmeta
      - coursemeta
      - taskmeta
      - activitymeta
      - discipline
      - tag
      - notification
      - favorite_project
      - favorite_workflow
      - projectteam
      - projectteam_member
    notes:
      - Render projectteam_member as PROJECTTEAM_USER if backward compatibility with existing Mermaid is required.
      - Render workflow-unit as one-to-one unless ratified otherwise.
      - Render unit-meta relationships as optional one-to-one; semantic exclusivity is enforced by rules, not by Mermaid alone.
