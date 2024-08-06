import { CHIP_TYPE } from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCardDumb'

const projects = [
  {
    id: 10,
    title: 'Project name',
    caption:
      'unless type greater into nest brown today toward cave phrase tower trade plus later ordinary nature becoming post using require soldier fifth angry reach',
    isSelected: false,
    isFavourite: true,
    chips: [
      {
        type: CHIP_TYPE.PROJECT,
        label: 'Project'
      },
      {
        type: CHIP_TYPE.PROGRAM,
        label: 'Program'
      }
    ]
  },
  {
    id: 1,
    title: 'Another project',
    caption:
      'knife also alone nation actual energy noon cover influence swung might steel entire origin birthday price receive meet subject present glad full best anybody',
    isSelected: false,
    isFavourite: false,
    chips: [
      {
        type: CHIP_TYPE.COURSE,
        label: 'Course'
      },
      {
        type: CHIP_TYPE.ACTIVITY,
        label: 'Activity'
      }
    ]
  },
  {
    id: 3,
    title: 'Very cool project',
    caption:
      'design record trade rear circus least end pig count clearly element deal possibly bush beauty pure build bread orbit particles building describe serve keep',
    isSelected: false,
    isFavourite: false,
    chips: [
      {
        type: CHIP_TYPE.TEMPLATE,
        label: 'Template'
      },
      {
        type: CHIP_TYPE.DEFAULT,
        label: 'Default'
      }
    ]
  },
  {
    id: 9,
    title: 'Best project ever',
    caption:
      'completely income gate tea compass married method suit slide mean speed jump red green felt large organization broken subject vast found positive wave wash',
    isSelected: false,
    isFavourite: false,
    chips: [
      {
        type: CHIP_TYPE.DEFAULT,
        label: 'Default'
      }
    ]
  },
  {
    id: 2,
    title: 'Testing a weird project name',
    caption:
      'spirit lot carbon thin typical nature sunlight practical cold bean direction center end having particles nest broken man condition mind adult area lay tool',
    isSelected: false,
    isFavourite: false,
    chips: [
      {
        type: CHIP_TYPE.DEFAULT,
        label: 'Default'
      }
    ]
  }
]

export default projects
