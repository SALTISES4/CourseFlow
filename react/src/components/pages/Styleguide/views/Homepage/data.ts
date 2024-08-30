import { CHIP_TYPE } from '@cfModule/components/common/cards/WorkflowCardDumb'

const data = {
  isTeacher: true,
  projects: [],
  templates: [
    {
      title: 'This is a template title',
      caption: 'This is a template caption',
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
      title: 'This is a template title',
      caption: 'This is a template caption',
      isSelected: false,
      isFavourite: true,
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
      title: 'This is a template title',
      caption: 'This is a template caption',
      isSelected: false,
      isFavourite: true,
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
      title: 'This is a template title',
      caption: 'This is a template caption',
      isSelected: false,
      isFavourite: true,
      chips: [
        {
          type: CHIP_TYPE.DEFAULT,
          label: 'Leave me alone'
        }
      ]
    }
  ]
}

export default data
