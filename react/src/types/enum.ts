import { Enum } from '@cfModule/utility/utilityFunctions'

export enum ViewType {
  WORKFLOW = 'workflowview',
  OUTCOME_EDIT = 'outcomeedit',
  GRID = 'grid',
  OUTCOMETABLE = 'outcometable',
  ALIGNMENTANALYSIS = 'alignmentanalysis',
  HORIZONTALOUTCOMETABLE = 'horizontaloutcometable'
  // WEEK = 'week',
}

export enum WFContext {
  WORKFLOW = 'workflow',
  COMPARISON = 'comparison'
}

export enum WorkflowType {
  ACTIVITY = 'activity',
  PROJECT = 'project',
  PROGRAM = 'program',
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
