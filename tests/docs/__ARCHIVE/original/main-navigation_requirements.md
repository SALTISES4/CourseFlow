# CourseFlow 2.0 — Main Navigation (Functional Requirements)

## Evidence and sources

- main navigation / 6+ favorites: [https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=608-4559&t=lsKQpS4Jq8MOZwMT-1](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=608-4559&t=lsKQpS4Jq8MOZwMT-1)
- main navigation / 5- favorites: [https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=2374-90306&t=lsKQpS4Jq8MOZwMT-1](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=2374-90306&t=lsKQpS4Jq8MOZwMT-1)
- main navigation / no favorites: [https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=2374-90508&t=lsKQpS4Jq8MOZwMT-1](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=2374-90508&t=lsKQpS4Jq8MOZwMT-1)
- main navigation / hover (collapse icon visible):[https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=2374-91141&t=lsKQpS4Jq8MOZwMT-1](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=2374-91141&t=lsKQpS4Jq8MOZwMT-1)
- main navigation / collapsed sidebar: [https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=807-5882&t=lsKQpS4Jq8MOZwMT-1](https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow-2.0?node-id=807-5882&t=lsKQpS4Jq8MOZwMT-1)

## Preconditions for all FR-NAV functional requirements

- User is authenticated

## Functional requirements

### FR-NAV-001 — Main Navigation presence

- **Preconditions**: [Main navigation] is not collapsed
- **Main flow**: [Main navigation] with menu items [Home], [My library], [Explore], optional [Favourites] (when user has favourites), [Help and Support] displays.

### FR-NAV-002 — [Home]

- **Preconditions**: [Main navigation] is not collapsed
- **Trigger**: User clicks on [Home]
- **Main flow**: User is taken to `/course-flow/home`
- **Acceptance**: 
  - User is on `/course-flow/home`
  - [Home] shows selected styling

### FR-NAV-003 — [My library]

- **Preconditions**: [Main navigation] is not collapsed
- **Trigger**: User clicks on [My library]
- **Main flow**: User is taken to `/course-flow/library`
- **Acceptance**:
  - User is on `/course-flow/library`
  - [My library] shows selected styling

### FR-NAV-004 — [Explore]

- **Preconditions**: [Main navigation] is not collapsed
- **Trigger**: User clicks on [Explore]
- **Main flow**: User is taken to `/course-flow/explore`
- **Acceptance**: 
  - User is on `/course-flow/explore`
  - [Explore] shows selected

### FR-NAV-005 — [Favourites] list

- **Preconditions**: 
  - [Main navigation] is not collapsed
  - User has between 1 to 5 favourited Workflows or Projects
- **Main flow**: System lists the 5 most recently viewed favourited Workflows or Projects
- **Acceptance**: 
  - [Favourites] section displays in the [Main navigation]
  - User can see 1 to 5 favourited Workflows or Projects in the [Favourites] section of the [Main navigation]
  - Visible favourited Workflows or Projects in the [Main navigation] are clickable

### FR-NAV-006 — [Favourites] list and [View all] visibility

- **Preconditions**: 
  - [Main navigation] is not collapsed
  - User has more than 6 or more favourited Workflows or Projects
- **Main flow**: System lists the 5 most recently accessed favourited Workflows or Projects, with a [View all] link below
- **Acceptance**: 
  - [Favourites] section displays in the [Main navigation]
  - User can see the 5 most recently viewed favourited Workflows or Projects in the [Favourites] section of the [Main navigation]
  - User can see a [View all] link below the 5 most recently viewed favourited Worfklows or Projects

### FR-NAV-007 — [Favourites] list and [View all] click

- **Preconditions**: 
  - [Main navigation] is not collapsed
  - User has more than 5 favourited Workflows or Projects, [View all] link is visible
  - User clicks on [View all]
- **Main flow**: User is taken to `/course-flow/favourites`
- **Acceptance**: 
  - User is on `/course-flow/favourites`

### FR-NAV-008 — Click on [Favourites] Workflows or Projects

- **Preconditions**: 
  - [Main navigation] is not collapsed
  - User has at least one favourited Workflow or Project
  - User clicks on a favourited Workflow or Project
- **Main flow**: User clicks on a favourited Workflow or Project and is taken to the Workflow detail page (`/course-flow/workflow/{id}`) or the Project detail page (`/course-flow/prject/{id}`)
- **Acceptance**: 
  - User is on the Workflow detail page (`/course-flow/workflow/{id}`) or the Project detail page (`/course-flow/prject/{id}`)

### FR-NAV-009 — [Main navigation] collapse

- **Preconditions**: 
  - [Main navigation] is not collapsed
  - User is hovering anywhere on the [Main navigation]
- **Trigger**: User hovers the [Main navigation] and clicks the [Collapse] icon
- **Main flow**: [Main navigation] is hidden from view and the [Expand] icon at the top left of the screen
- **Acceptance**: 
  - [Main navigation] is not visible
  - [Expand] icon is visible at the top left of the screen

### FR-NAV-010 — [Main navigation] expand

- **Preconditions**: 
  - [Main navigation] is collapsed
- **Trigger**: User clicks on the [Expand] icon
- **Main flow**: [Main navigation] becomes visible and [Expand] icon is hidden
- **Acceptance**: 
  - [Main navigation] is visible
  - [Expand] icon is hidden

### FR-NAV-011 — [Help and Support]

- **Preconditions**: 
  - [Main navigation] is not collapsed
- **Trigger**: User clicks on [Help and Support]
- **Main flow**: **Freshdesk** opens in a new tab
- **Acceptance**: `https://courseflow.freshdesk.com/support/home` is loaded in a new tab

### FR-NAV-012 — Workflow contains [NOT READY]

- **Preconditions**: 
  - [Main navigation] is not collapsed
  - User is viewing a Workflow which has at least one Node linked to a child Workflow
- **Trigger**: -
- **Main flow**: -
- **Acceptance**:
  - A [Contains] section, which included linked child Workflows, is visible in the [Main navigation]

### FR-NAV-013 — Workflow contains [NOT READY]

- **Preconditions**: 
  - [Main navigation] is not collapsed
  - User is viewing a Workflow which has at been linked to a parent Workflow from a Node in the parent Workflow
- **Trigger**: -
- **Main flow**: -
- **Acceptance**:
  - A [Appears in] section, which included linked parent Workflows, is visible in the [Main navigation]

