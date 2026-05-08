/**
 * App route path templates (React Router).
 * Lives in its own module so utilities can import paths without loading the router tree
 * (avoids circular: Utility → appRoutes → Base → Sidebar → strings → Utility).
 */

export enum RelativeRoutes {
  INDEX = '/',
  WORKFLOWS = 'workflows',
  GRAPH = `graph`,
  ALIGNMENT_ANALYSIS = `alignment`,
  OUTCOME_TABLE = `outcometable`,
  OUTCOME_EDIT = `outcomedit`,
  GRID = `grid`,
  COMPARISON = 'comparison'
}

export enum CFRoutes {
  HOME = `/home`,
  LIBRARY = `/library`,
  FAVOURITES = `/favourites`,
  EXPLORE = `/explore`,
  NOTIFICATIONS = `/user/notifications`,
  NOTIFICATIONS_SETTINGS = `/user/notifications-settings`,
  PROFILE_SETTINGS = `/user/profile-settings`,
  PROJECT = `/project/:uuid`,
  PROJECT_WORKFLOW = `/project/:uuid/workflows`,
  WORKFLOW = `/workflow/:uuid`,
  WORKFLOW_GRAPH = `/workflow/:uuid/${RelativeRoutes.GRAPH}`,
  WORKFLOW_ALIGNMENT_ANALYSIS = `/workflow/:uuid/${RelativeRoutes.ALIGNMENT_ANALYSIS}`,
  WORKFLOW_OUTCOME_TABLE = `/workflow/:uuid/${RelativeRoutes.OUTCOME_TABLE}`,
  WORKFLOW_OUTCOME_EDIT = `/workflow/:uuid/${RelativeRoutes.OUTCOME_EDIT}`,
  WORKFLOW_GRID = `/workflow/:uuid/${RelativeRoutes.GRID}`
}
