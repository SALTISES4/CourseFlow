export enum OBJECT_SET_TYPE {
  PROGRAM_OUTCOME = 'program outcome',
  COURSE_OUTCOME = 'course outcome',
  ACTIVITY_OUTCOME = 'activity outcome',
  PROGRAM_NODE = 'program node',
  COURSE_NODE = 'course node',
  ACTIVITY_NODE = 'activity node'
}

export type ObjectSetType = {
  type: OBJECT_SET_TYPE
  label: string
}
