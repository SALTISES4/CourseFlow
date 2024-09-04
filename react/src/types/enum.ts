import { Enum } from '@cf/utility/utilityFunctions'

// this is guidelines for our wofklow tabs
// each view type is more or less a tab

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

export enum LibraryObjectType {
  PROGRAM = 'program',
  ACTIVITY = 'activity',
  PROJECT = 'project',
  COURSE = 'course',
  LIVE_PROJECT = 'liveproject'
}

export enum CfObjectType {
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
  STRATEGY = 'strategy',
  OUTCOMEHORIZONTALLINK = 'outcomehorizontallink',
  OUTCOMEWORKFLOW = 'outcomeworkflow',
  NODEWEEK = 'nodeweek',
  WEEKWORKFLOW = 'weekworkflow',
  COURSE = 'course'
}

export enum OBJECT_TYPE {
  OUTCOME = 'outcome',
  PROJECT = 'project',
  STRATEGY = 'strategy'
}

export enum VERB {
  POSTED = 'posted',
  ERROR = 'error',
  GET = 'get'
}
