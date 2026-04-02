import { _t } from '@cf/utility/Utility.class'

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
  20: { colour: '#369934', icon: 'other' },

  // new blank workflow view node category/channel
  'new-column': { colour: '#bbb', icon: 'other' }
}

export const permissionKeys = {
  none: 0,
  view: 1,
  edit: 2,
  comment: 3,
  student: 4
}

/*******************************************************
 * FUNCTIONS
 *******************************************************/

export enum LanguageOptions {
  EN = 'en',
  FR = 'fr'
}

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
