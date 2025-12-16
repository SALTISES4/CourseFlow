import { NumTuple } from '@cf/types/common'
import { CfObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import { LanguageOptions } from '@XMLHTTP/API/user.rtk'

/*
Determines how long an action locks an object
by default, in ms. Once the action ends, the lock
is cleared (so this is a maximum time).
*/
export const lockTimes = {
  move: 5000,
  update: 5000,
  select: 60000
}

export const nodeKeys = ['activity', 'course', 'program']

export const columnwidth = 160

export const nodePorts = {
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

export const portKeys = ['n', 'e', 's', 'w']

export const portDirection: NumTuple[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0]
]

export const portPadding = 10

export const taskKeys = {
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

export const contextKeys = {
  0: '',
  1: 'solo',
  2: 'group',
  3: 'class',
  101: 'exercise',
  102: 'test',
  103: 'exam'
}

export const strategyKeys = {
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

export const defaultColumnSettings = {
  // activities
  0: { colour: '#6738ff', icon: 'other' },
  1: { colour: '#0b118a', icon: 'ooci' },
  2: { colour: '#114cd4', icon: 'home' },
  3: { colour: '#11b3d4', icon: 'instruct' },
  4: { colour: '#04d07d', icon: 'students' },

  // courses
  10: { colour: '#6738ff', icon: 'other' },
  11: { colour: '#ad351d', icon: 'homework' },
  12: { colour: '#ed4a28', icon: 'lesson' },
  13: { colour: '#ed8934', icon: 'artifact' },
  14: { colour: '#f7ba2a', icon: 'assessment' },

  // programs
  20: { colour: '#369934', icon: 'other' }
}

export const nodeTypeKeys = {
  0: 'activity node',
  1: 'course node',
  2: 'program node'
}

// @todo this is redundant now
export const objectDictionary = {
  nodelink: CfObjectType.NODELINK,
  node: CfObjectType.NODE,
  week: CfObjectType.WEEK,
  column: CfObjectType.COLUMN,
  outcome: CfObjectType.OUTCOME,
  outcomeBase: CfObjectType.OUTCOME,
  workflow: CfObjectType.WORKFLOW,
  outcomenode: CfObjectType.OUTCOMENODE
}

export const parentDictionary = {
  nodelink: 'node',
  node: 'week',
  week: 'workflow',
  column: 'workflow',
  outcome: 'outcome',
  outcomeBase: 'workflow'
}

export const throughParentDictionary = {
  node: 'nodeweek',
  week: 'weekworkflow',
  column: 'columnworkflow',
  outcome: 'outcomeoutcome',
  outcomeBase: 'outcomeworkflow'
}

export const permissionKeys = {
  none: 0,
  view: 1,
  edit: 2,
  comment: 3,
  student: 4
}

export const roleKeys = {
  none: 0,
  student: 1,
  teacher: 2
}

export const defaultDropState = {
  node: false,
  week: true,
  outcome: [true, false, false, false, false]
}

/*******************************************************
 * FUNCTIONS
 *******************************************************/

/**
 * this should be simplified
 **/
export const getLabelForCfObject = function ({
  objectType
}: {
  objectType: CfObjectType
}) {
  return String(objectType)
  // switch (objectType) {
  //   case CfObjectType.NODE:
  //     return data.nodeTypeDisplay
  //
  //   case CfObjectType.WORKFLOW:
  //     return {
  //       activity: _t('Activity'),
  //       course: _t('Course'),
  //       program: _t('Program'),
  //       workflow: _t('Workflow')
  //     }[data.type]
  //
  //   case CfObjectType.WEEK:
  //     return data.weekTypeDisplay
  // }
  // return {
  //   outcomeBase: _t('Outcome'),
  //   nodelink: _t('Node Link'),
  //   outcome: _t('Outcome'),
  //   column: _t('Column'),
  //   project: _t('Project'),
  //   outcomehorizontallink: _t('Association to the parent outcome'),
  //   outcomenode: _t('Association to the outcome')
  // }[objectType]
}

export const getDefaultDropState = (objectId, objectType, depth = 1) => {
  let defaultDrop = defaultDropState[objectType]
  if (objectType === 'outcome') {
    if (depth < defaultDrop.length) {
      defaultDrop = defaultDrop[depth]
    } else {
      defaultDrop = false
    }
  }
  return defaultDrop
}

/**
 * get all possible object sets
 **/
export const objectSetsTypes = () => ({
  'program outcome': ThemeHelper.capFirst(_t('program outcome')),
  'course outcome': ThemeHelper.capFirst(_t('course outcome')),
  'activity outcome': ThemeHelper.capFirst(_t('activity outcome')),
  'program node': ThemeHelper.capFirst(_t('program node')),
  'course node': ThemeHelper.capFirst(_t('course node')),
  'activity node': ThemeHelper.capFirst(_t('activity node'))
})

// @todo no
//missingTranslations, DO NOT DELETE. This will ensure that a few "utility" translations that don't otherwise show up get translated
// function missingTranslations() {
//   Utility.logger('missingTranslations called')
//   _t('activity')
//   _t('course')
//   _t('program')
//   _t('project')
// }

export const languageOptions = [
  {
    label: 'English',
    value: LanguageOptions.EN
  },
  {
    label: 'French',
    value: LanguageOptions.FR
  }
]

export enum SnackbarOptions {
  ERROR = 'error',
  SUCCESS = 'success'
}
