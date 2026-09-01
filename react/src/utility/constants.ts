import { _t } from '@cf/utility/Utility.class'

export const taskKeys = {
  none: '',
  gather_information: 'research',
  discuss: 'discuss',
  problem_solve: 'problem',
  analyze: 'analyze',
  assess_review_peers: 'peerreview',
  debate: 'debate',
  game_roleplay: 'play',
  create_design: 'create',
  revise_improve: 'practice',
  read: 'reading',
  write: 'write',
  present: 'present',
  experiment_inquiry: 'experiment',
  quiz_test: 'quiz',
  instructor_resource_curation: 'curation',
  instructor_orchestration: 'orchestration',
  instructor_evaluation: 'instrevaluate',
  other: 'other',
  jigsaw: 'jigsaw',
  peer_instruction: 'peer-instruction',
  case_studies: 'case-studies',
  gallery_walk: 'gallery-walk',
  reflective_writing: 'reflective-writing',
  two_stage_exam: 'two-stage-exam',
  toolkit: 'toolkit',
  one_minute_paper: 'one-minute-paper',
  distributed_problem_solving: 'distributed-problem-solving',
  peer_assessment: 'peer-assessment'
}

export const contextKeys = {
  none: '',
  individual_work: 'solo',
  work_in_groups: 'group',
  in_the_classroom: 'class',
  formative: 'exercise',
  summative: 'test',
  comprehensive: 'exam'
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
