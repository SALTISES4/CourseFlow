/*******************************************************
 * // this is not a real 'datatype', but is useful for some commands which group
 * // workflows together and differentiate them from project (like archive, delete),
 * // argument to be made that this should be handled by CfObjectType
 *******************************************************/
export enum WorkspaceType {
  WORKFLOW = 'workflow',
  PROJECT = 'project'
}

/*******************************************************
 * // corresponds to the different presentation layers of the workspace
 * // see workspace tabs, they are matched (for now)
 * // WorkflowViewType additionally is one dimension which informs the workspace utility sidebar
 *******************************************************/
export enum WorkflowViewType {
  OVERVIEW = 'workflowoverview',
  WORKFLOW = 'workflowview',
  OUTCOME_EDIT = 'outcomeedit',
  GRID_VIEW = 'grid',
  OUTCOME_TABLE = 'outcometable',
  ALIGNMENT_ANALYSIS = 'alignmentanalysis',
  HORIZONTAL_OUTCOME_TABLE = 'horizontaloutcometable'
}

export enum WorkflowType {
  PROGRAM = 'program',
  ACTIVITY = 'activity',
  COURSE = 'course'
}

export enum WorkflowContext {
  WORKFLOW = 'workflow',
  COMPARISON = 'comparison'
}
