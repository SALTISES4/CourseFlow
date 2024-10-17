export type ConfigType = {
  workflowType?: WorkflowType | null
  viewType?: ViewType | null
  permissionType?: ViewPermissions | null
  visibilityType?: ViewVisibility | null
}

export enum WorkflowType {
  ACTIVITY = 'activity', // lowest level unit, can be broken into Parts
  COURSE = 'course', // mid level unit, broken down into Weeks
  PROGRAM = 'program', // largest level unit, broken down into Terms
  PROJECT = 'project' // serves as a group of activity|course|program workflows
}

// each workflow type has various views/tabs
export enum ViewType {
  OVERVIEW = 'overview',
  WORKFLOW = 'workflow',
  OUTCOMES = 'outcomes',
  OUTCOME_TABLE = 'outcome_table',
  OUTCOME_ANALYTICS = 'outcome_analytics',
  GRID_VIEW = 'grid_view'
}

export enum ViewPermissions {
  OWNER = 'owner',
  EDITOR = 'editor',
  COMMENTER = 'commenter',
  VIEWER = 'viewer',
  ANONYMOUS = 'anonymous'
}

export enum ViewVisibility {
  PUBLISH = 'publish',
  PRIVATE = 'private',
  ARCHIVE = 'archive'
}
