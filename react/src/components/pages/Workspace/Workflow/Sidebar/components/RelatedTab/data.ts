import { RelatedTabType } from '../../types'

const data: RelatedTabType = {
  title: 'Outcomes from parent workflows',
  subtitle:
    'Drag and drop to associate outcomes from parents workflows to outcomes of your current workflow. Click on an outcome to highlight relevant nodes.',
  alert: true,
  groups: [
    {
      type: 'object_sets_1',
      title: 'Object sets 1',
      blocks: [
        {
          id: 1,
          label: 'Outcome name 1 with a super long name',
          blocks: [
            {
              id: 1,
              label: 'Outcome name 1',
              blocks: [
                {
                  id: 1,
                  label: 'Outcome name 1'
                },
                {
                  id: 2,
                  label: 'Outcome name 2'
                },
                {
                  id: 3,
                  label: 'Outcome name 3'
                }
              ]
            },
            {
              id: 2,
              label: 'Outcome name 2'
            },
            {
              id: 3,
              label: 'Outcome name 3'
            }
          ]
        },
        {
          id: 2,
          label: 'Outcome name 2',
          blocks: [
            {
              id: 1,
              label: 'Outcome name 1'
            },
            {
              id: 2,
              label: 'Outcome name 2'
            },
            {
              id: 3,
              label: 'Outcome name 3'
            }
          ]
        },
        {
          id: 3,
          label: 'Outcome name 3'
        },
        {
          id: 4,
          label: 'Outcome name 4',
          blocks: [
            {
              id: 1,
              label: 'Outcome name 1'
            },
            {
              id: 2,
              label: 'Outcome name 2'
            },
            {
              id: 3,
              label: 'Outcome name 3'
            }
          ]
        },
        {
          id: 5,
          label: 'Outcome name 5'
        }
      ]
    },
    {
      type: 'object_sets_2',
      title: 'Object sets 2',
      blocks: [
        {
          id: 1,
          label: 'Outcome name 1',
          blocks: [
            {
              id: 1,
              label: 'Outcome name 1',
              blocks: [
                {
                  id: 1,
                  label: 'Outcome name 1'
                },
                {
                  id: 2,
                  label: 'Outcome name 2'
                },
                {
                  id: 3,
                  label: 'Outcome name 3'
                }
              ]
            },
            {
              id: 2,
              label: 'Outcome name 2'
            },
            {
              id: 3,
              label: 'Outcome name 3'
            }
          ]
        },
        {
          id: 2,
          label: 'Outcome name 2',
          blocks: [
            {
              id: 1,
              label: 'Outcome name 1'
            },
            {
              id: 2,
              label: 'Outcome name 2'
            },
            {
              id: 3,
              label: 'Outcome name 3'
            }
          ]
        },
        {
          id: 3,
          label: 'Outcome name 3'
        },
        {
          id: 4,
          label: 'Outcome name 4',
          blocks: [
            {
              id: 1,
              label: 'Outcome name 1'
            },
            {
              id: 2,
              label: 'Outcome name 2'
            },
            {
              id: 3,
              label: 'Outcome name 3'
            }
          ]
        },
        {
          id: 5,
          label: 'Outcome name 5'
        }
      ]
    }
  ]
}

export default data
