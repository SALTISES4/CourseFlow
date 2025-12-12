import { timeUnits } from '@cfComponents/dialog/Workflow/CreateWizardDialog/types'

const contexts = [
  {
    value: 0,
    label: 'None'
  },
  {
    value: 1,
    label: 'Jigsaw'
  },
  {
    value: 2,
    label: 'Peer Instruction'
  },
  {
    value: 3,
    label: 'Case Studies'
  },
  {
    value: 4,
    label: 'Gallery Walk'
  },
  {
    value: 5,
    label: 'Reflective Writing'
  },
  {
    value: 6,
    label: 'Two-Stage Exam'
  },
  {
    value: 7,
    label: 'Toolkit'
  },
  {
    value: 8,
    label: 'One Minute Paper'
  },
  {
    value: 9,
    label: 'Distributed Problem Solving'
  },
  {
    value: 10,
    label: 'Peer Assessment'
  },
  {
    value: 11,
    label: 'Other'
  }
]

const taskTypes = [
  {
    value: 1,
    label: 'Toolkit'
  },
  {
    value: 2,
    label: 'One Minute Paper'
  },
  {
    value: 3,
    label: 'Distributed Problem Solving'
  },
  {
    value: 4,
    label: 'Peer Assessment'
  },
  {
    value: 5,
    label: 'Other'
  }
]

const unitTypes = [
  {
    value: 1,
    label: 'Credits'
  },
  {
    value: 2,
    label: 'Something else'
  },
  {
    value: 3,
    label: 'Another unit type'
  },
  {
    value: 4,
    label: 'Other'
  }
]

const tags = [
  {
    id: 1,
    label: 'Object set 1'
  },
  {
    id: 2,
    label: 'Object set 2'
  },
  {
    id: 3,
    label: 'Object set 3'
  },
  {
    id: 4,
    label: 'Object set 4'
  },
  {
    id: 5,
    label: 'Object set 5'
  }
]

export default {
  contexts,
  taskTypes,
  tags,
  unitTypes,
  timeUnits: timeUnits.filter((u) => u)
}
