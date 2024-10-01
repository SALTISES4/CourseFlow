import { ChipOptions } from '@cf/components/common/cards/WorkflowCardDumb'

const data = {
  projects: [],
  templates: [
    {
      title: 'This is a template title',
      caption: 'This is a template caption',
      isSelected: false,
      isFavourite: true,
      chips: [
        {
          type: ChipOptions.PROJECT,
          label: 'Project'
        },
        {
          type: ChipOptions.PROGRAM,
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
          type: ChipOptions.COURSE,
          label: 'Course'
        },
        {
          type: ChipOptions.ACTIVITY,
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
          type: ChipOptions.TEMPLATE,
          label: 'Template'
        },
        {
          type: ChipOptions.DEFAULT,
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
          type: ChipOptions.DEFAULT,
          label: 'Leave me alone'
        }
      ]
    }
  ]
}

export default data
