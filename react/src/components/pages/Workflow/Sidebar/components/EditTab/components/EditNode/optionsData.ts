const activityContexts = [
  {
    value: 0,
    label: 'None'
  },
  {
    value: 1,
    label: 'Individual Work'
  },
  {
    value: 2,
    label: 'Work in Groups'
  },
  {
    value: 3,
    label: 'Whole Class'
  }
]

const courseContexts = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Formative' },
  { value: 2, label: 'Summative' },
  { value: 3, label: 'Comprehensive' }
]

const taskTypes = [
  { value: 0, label: 'None' },
  {
    value: 1,
    label: 'Gather Information'
  },
  {
    value: 2,
    label: 'Discuss'
  },
  {
    value: 3,
    label: 'Problem Solve'
  },
  {
    value: 4,
    label: 'Analyze'
  },
  {
    value: 5,
    label: 'Assess/Review Peers'
  },
  { value: 6, label: 'Debate' },
  { value: 7, label: 'Game/Roleplay' },
  { value: 8, label: 'Create/Design' },
  { value: 9, label: 'Revise/Improve' },
  { value: 10, label: 'Read' },
  { value: 11, label: 'Write' },
  { value: 12, label: 'Present' },
  { value: 13, label: 'Experiment/Inquiry' },
  { value: 14, label: 'Quiz/Test' },
  { value: 15, label: 'Instructor Resource Curation' },
  { value: 16, label: 'Instructor Orchestration' },
  { value: 17, label: 'Instructor Evaluation' },
  { value: 18, label: 'Other' }
]

// Outcome editing still consumes this legacy local option seam. Edit-node tags
// are loaded from the parent project's persisted catalog instead.
const tags = [
  { uuid: 1, label: 'Tag 1' },
  { uuid: 2, label: 'Tag 2' },
  { uuid: 3, label: 'Tag 3' },
  { uuid: 4, label: 'Tag 4' },
  { uuid: 5, label: 'Tag 5' }
]

export default {
  activityContexts,
  courseContexts,
  taskTypes,
  tags
}
