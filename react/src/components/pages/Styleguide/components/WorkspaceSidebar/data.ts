import { SidebarDataType } from './types'

const data: SidebarDataType = {
  edit: {
    title: 'Edit node',
    readonly: true
  },
  add: {
    title: 'Add to workflow',
    subtitle: 'Drag and drop to add nodes.',
    groups: [
      {
        type: 'node',
        title: 'Node categories',
        blocks: [
          {
            id: 1,
            type: 'block_1',
            label: 'Out of class (instructor)'
          },
          {
            id: 2,
            type: 'block_2',
            label: 'Out of class (students)'
          },
          {
            id: 3,
            type: 'block_3',
            label: 'In class (instructor)'
          },
          {
            id: 4,
            type: 'block_4',
            label: 'In class (students)'
          },
          {
            id: 5,
            type: 'block_5',
            label: 'Custom node category'
          }
        ]
      },
      {
        type: 'reusable',
        title: 'Reusable blocks',
        blocks: [
          {
            id: 1,
            type: 'block_1',
            label: 'Block 1'
          },
          {
            id: 2,
            type: 'block_2',
            label: 'Block 2'
          },
          {
            id: 3,
            type: 'block_3',
            label: 'Block 3'
          }
        ]
      },
      {
        type: 'strategies',
        title: 'Strategies',
        blocks: [
          {
            id: 1,
            type: 'block_1',
            label: 'Jigsaw'
          },
          {
            id: 2,
            type: 'block_2',
            label: 'Peer instruction'
          },
          {
            id: 3,
            type: 'block_3',
            label: 'Toolkit'
          },
          {
            id: 4,
            type: 'block_4',
            label: 'Case studies'
          },
          {
            id: 5,
            type: 'block_5',
            label: 'Gallery walk'
          },
          {
            id: 6,
            type: 'block_6',
            label: 'Reflective writing'
          },
          {
            id: 7,
            type: 'block_7',
            label: 'Two stage exam'
          }
        ]
      }
    ]
  },
  outcomes: {
    title: 'Outcomes'
  },
  restore: {
    title: 'Restore items',
    readonly: true
  }
}

export default data
