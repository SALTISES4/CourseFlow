// this is not a real 'datatype', but is useful for some commands which group
// workflows together and differentiate them from project (like archive, delete),
// argument to be made that this should be handled by CfObjectType
export enum WorkSpaceType {
  WORKFLOW = 'workflow',
  PROJECT = 'project'
}

// corresponds to the different presentation layers of the workspace
// see workspace tabs, they are matched (for now)
// WorkflowViewType additionally is one dimension which informs the workspace utility sidebar
export enum WorkflowViewType {
  WORKFLOW = 'workflowview',
  OUTCOME_EDIT = 'outcomeedit',
  GRID = 'grid',
  OUTCOMETABLE = 'outcometable',
  ALIGNMENTANALYSIS = 'alignmentanalysis',
  HORIZONTALOUTCOMETABLE = 'horizontaloutcometable',
  WORKFLOW_OVERVIEW = 'workflowoverview'
}

export enum WFContext {
  WORKFLOW = 'workflow',
  COMPARISON = 'comparison'
}

export enum WorkflowType {
  PROGRAM = 'program',
  ACTIVITY = 'activity',
  COURSE = 'course'
}

// simplified datatype returned to queries to the library
// this includes the wrapping 'project' as well as the different types of 'Workflow'
export enum LibraryObjectType {
  PROJECT = 'project',
  PROGRAM = 'program',
  ACTIVITY = 'activity',
  COURSE = 'course'
}

// all the different entity types in the project related to a 'workflow'
export enum CfObjectType {
  STRATEGY = 'strategy', // this is like a template, it might not belong here
  PROJECT = 'project',
  NODELINK = 'nodelink',
  NODE = 'node',
  WEEK = 'week',
  COLUMN = 'column',
  OUTCOME = 'outcome',
  // OUTCOME_BASE = 'outcome',
  WORKFLOW = 'workflow',
  COLUMNWORKFLOW = 'columnworkflow',
  OUTCOMENODE = 'outcomenode',
  OUTCOMEOUTCOME = 'outcomeoutcome',
  OUTCOMEHORIZONTALLINK = 'outcomehorizontallink',
  OUTCOMEWORKFLOW = 'outcomeworkflow',
  NODEWEEK = 'nodeweek',
  WEEKWORKFLOW = 'weekworkflow'
}

// @todo unclear data type
export enum objectType {
  OUTCOME = 'outcome',
  PROJECT = 'project',
  STRATEGY = 'strategy'
}
