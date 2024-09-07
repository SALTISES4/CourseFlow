import { NumTuple } from '@cf/types/common'
import { _t } from '@cf/utility/utilityFunctions'
import * as Utility from '@cfUtility'

/*
Determines how long an action locks an object
by default, in ms. Once the action ends, the lock
is cleared (so this is a maximum time).
*/
export const lock_times = {
  move: 5000,
  update: 5000,
  select: 60000
}

export const node_keys = ['activity', 'course', 'program']

export const columnwidth = 160

export const node_ports = {
  source: {
    e: [1, 0.6],
    w: [0, 0.6],
    s: [0.5, 1]
  },
  target: {
    n: [0.5, 0],
    e: [1, 0.4],
    w: [0, 0.4]
  }
}

export const port_keys = ['n', 'e', 's', 'w']

export const port_direction: NumTuple[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0]
]

export const port_padding = 10

export const task_keys = {
  0: '',
  1: 'research',
  2: 'discuss',
  3: 'problem',
  4: 'analyze',
  5: 'peerreview',
  6: 'debate',
  7: 'play',
  8: 'create',
  9: 'practice',
  10: 'reading',
  11: 'write',
  12: 'present',
  13: 'experiment',
  14: 'quiz',
  15: 'curation',
  16: 'orchestration',
  17: 'instrevaluate',
  18: 'other',
  101: 'jigsaw',
  102: 'peer-instruction',
  103: 'case-studies',
  104: 'gallery-walk',
  105: 'reflective-writing',
  106: 'two-stage-exam',
  107: 'toolkit',
  108: 'one-minute-paper',
  109: 'distributed-problem-solving',
  110: 'peer-assessment'
}

export const context_keys = {
  0: '',
  1: 'solo',
  2: 'group',
  3: 'class',
  101: 'exercise',
  102: 'test',
  103: 'exam'
}

export const strategy_keys = {
  0: '',
  1: 'jigsaw',
  2: 'peer-instruction',
  3: 'case-studies',
  4: 'gallery-walk',
  5: 'reflective-writing',
  6: 'two-stage-exam',
  7: 'toolkit',
  8: 'one-minute-paper',
  9: 'distributed-problem-solving',
  10: 'peer-assessment',
  11: 'other'
}

export const default_column_settings = {
  0: { colour: '#6738ff', icon: 'other' },
  1: { colour: '#0b118a', icon: 'ooci' },
  2: { colour: '#114cd4', icon: 'home' },
  3: { colour: '#11b3d4', icon: 'instruct' },
  4: { colour: '#04d07d', icon: 'students' },
  10: { colour: '#6738ff', icon: 'other' },
  11: { colour: '#ad351d', icon: 'homework' },
  12: { colour: '#ed4a28', icon: 'lesson' },
  13: { colour: '#ed8934', icon: 'artifact' },
  14: { colour: '#f7ba2a', icon: 'assessment' },
  20: { colour: '#369934', icon: 'other' }
}

export const node_type_keys = {
  0: 'activity node',
  1: 'course node',
  2: 'program node'
}

// @todo this is redundant now
export const object_dictionary = {
  nodelink: 'nodelink',
  node: 'node',
  week: 'week',
  column: 'column',
  outcome: 'outcome',
  outcome_base: 'outcome',
  workflow: 'workflow',
  outcomenode: 'outcomenode'
}

export const parent_dictionary = {
  nodelink: 'node',
  node: 'week',
  week: 'workflow',
  column: 'workflow',
  outcome: 'outcome',
  outcome_base: 'workflow'
}

export const through_parent_dictionary = {
  node: 'nodeweek',
  week: 'weekworkflow',
  column: 'columnworkflow',
  outcome: 'outcomeoutcome',
  outcome_base: 'outcomeworkflow'
}

export const get_verbose = function (data, object_type) {
  switch (object_type) {
    case 'node':
      return data.node_type_display
    case 'workflow':
    case 'activity':
    case 'course':
    case 'program':
      return {
        activity: _t('Activity'),
        course: _t('Course'),
        program: _t('Program'),
        workflow: _t('Workflow')
      }[data.type]
    case 'week':
      return data.week_type_display
  }
  return {
    outcome_base: _t('Outcome'),
    nodelink: _t('Node Link'),
    outcome: _t('Outcome'),
    column: _t('Column'),
    project: _t('Project'),
    outcomehorizontallink: _t('Association to the parent outcome'),
    outcomenode: _t('Association to the outcome')
  }[object_type]
}

export const permission_keys = {
  none: 0,
  view: 1,
  edit: 2,
  comment: 3,
  student: 4
}

export enum PERMISSION_KEYS {
  NONE,
  VIEW,
  EDIT,
  COMMENT,
  STUDENT
}

export const role_keys = {
  none: 0,
  student: 1,
  teacher: 2
}

export const default_drop_state = {
  node: false,
  week: true,
  outcome: [true, false, false, false, false]
}

export const get_default_drop_state = (objectId, objectType, depth = 1) => {
  let default_drop = default_drop_state[objectType]
  if (objectType === 'outcome') {
    if (depth < default_drop.length) default_drop = default_drop[depth]
    else default_drop = false
  }
  return default_drop
}

// Get the colour from a column
export function getColumnColour(data) {
  if (data.colour == null)
    return default_column_settings[data.column_type].colour
  else return '#' + ('000000' + data.colour?.toString(16)).slice(-6)
}

//get all possible object sets
export function object_sets_types() {
  return {
    'program outcome': Utility.capFirst(_t('program outcome')),
    'course outcome': Utility.capFirst(_t('course outcome')),
    'activity outcome': Utility.capFirst(_t('activity outcome')),
    'program node': Utility.capFirst(_t('program node')),
    'course node': Utility.capFirst(_t('course node')),
    'activity node': Utility.capFirst(_t('activity node'))
  }
}

//missing_translations, DO NOT DELETE. This will ensure that a few "utility" translations that don't otherwise show up get translated
function missing_translations() {
  console.log('missing_translations called')
  _t('activity')
  _t('course')
  _t('program')
  _t('project')
}
