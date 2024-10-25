import { v4 as uuidv4 } from 'uuid'

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
    title: 'Outcomes',
    subtitle:
      'Drag and drop to associate outcomes to nodes. Click on an outcome to highlight relevant nodes.',
    groups: [
      {
        type: 'object_sets_1',
        title: 'Object sets 1',
        blocks: [
          {
            id: 1,
            type: 'block_1',
            label: 'Outcome name 1 with a super long name',
            blocks: [
              {
                id: 1,
                type: 'block_1',
                label: 'Outcome name 1',
                blocks: [
                  {
                    id: 1,
                    type: 'block_1',
                    label: 'Outcome name 1'
                  },
                  {
                    id: 2,
                    type: 'block_2',
                    label: 'Outcome name 2'
                  },
                  {
                    id: 3,
                    type: 'block_3',
                    label: 'Outcome name 3'
                  }
                ]
              },
              {
                id: 2,
                type: 'block_2',
                label: 'Outcome name 2'
              },
              {
                id: 3,
                type: 'block_3',
                label: 'Outcome name 3'
              }
            ]
          },
          {
            id: 2,
            type: 'block_2',
            label: 'Outcome name 2',
            blocks: [
              {
                id: 1,
                type: 'block_1',
                label: 'Outcome name 1'
              },
              {
                id: 2,
                type: 'block_2',
                label: 'Outcome name 2'
              },
              {
                id: 3,
                type: 'block_3',
                label: 'Outcome name 3'
              }
            ]
          },
          {
            id: 3,
            type: 'block_3',
            label: 'Outcome name 3'
          },
          {
            id: 4,
            type: 'block_4',
            label: 'Outcome name 4',
            blocks: [
              {
                id: 1,
                type: 'block_1',
                label: 'Outcome name 1'
              },
              {
                id: 2,
                type: 'block_2',
                label: 'Outcome name 2'
              },
              {
                id: 3,
                type: 'block_3',
                label: 'Outcome name 3'
              }
            ]
          },
          {
            id: 5,
            type: 'block_5',
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
            type: 'block_1',
            label: 'Outcome name 1',
            blocks: [
              {
                id: 1,
                type: 'block_1',
                label: 'Outcome name 1',
                blocks: [
                  {
                    id: 1,
                    type: 'block_1',
                    label: 'Outcome name 1'
                  },
                  {
                    id: 2,
                    type: 'block_2',
                    label: 'Outcome name 2'
                  },
                  {
                    id: 3,
                    type: 'block_3',
                    label: 'Outcome name 3'
                  }
                ]
              },
              {
                id: 2,
                type: 'block_2',
                label: 'Outcome name 2'
              },
              {
                id: 3,
                type: 'block_3',
                label: 'Outcome name 3'
              }
            ]
          },
          {
            id: 2,
            type: 'block_2',
            label: 'Outcome name 2',
            blocks: [
              {
                id: 1,
                type: 'block_1',
                label: 'Outcome name 1'
              },
              {
                id: 2,
                type: 'block_2',
                label: 'Outcome name 2'
              },
              {
                id: 3,
                type: 'block_3',
                label: 'Outcome name 3'
              }
            ]
          },
          {
            id: 3,
            type: 'block_3',
            label: 'Outcome name 3'
          },
          {
            id: 4,
            type: 'block_4',
            label: 'Outcome name 4',
            blocks: [
              {
                id: 1,
                type: 'block_1',
                label: 'Outcome name 1'
              },
              {
                id: 2,
                type: 'block_2',
                label: 'Outcome name 2'
              },
              {
                id: 3,
                type: 'block_3',
                label: 'Outcome name 3'
              }
            ]
          },
          {
            id: 5,
            type: 'block_5',
            label: 'Outcome name 5'
          }
        ]
      }
    ]
  },
  related: {
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
            type: 'block_1',
            label: 'Outcome name 1 with a super long name',
            blocks: [
              {
                id: 1,
                type: 'block_1',
                label: 'Outcome name 1',
                blocks: [
                  {
                    id: 1,
                    type: 'block_1',
                    label: 'Outcome name 1'
                  },
                  {
                    id: 2,
                    type: 'block_2',
                    label: 'Outcome name 2'
                  },
                  {
                    id: 3,
                    type: 'block_3',
                    label: 'Outcome name 3'
                  }
                ]
              },
              {
                id: 2,
                type: 'block_2',
                label: 'Outcome name 2'
              },
              {
                id: 3,
                type: 'block_3',
                label: 'Outcome name 3'
              }
            ]
          },
          {
            id: 2,
            type: 'block_2',
            label: 'Outcome name 2',
            blocks: [
              {
                id: 1,
                type: 'block_1',
                label: 'Outcome name 1'
              },
              {
                id: 2,
                type: 'block_2',
                label: 'Outcome name 2'
              },
              {
                id: 3,
                type: 'block_3',
                label: 'Outcome name 3'
              }
            ]
          },
          {
            id: 3,
            type: 'block_3',
            label: 'Outcome name 3'
          },
          {
            id: 4,
            type: 'block_4',
            label: 'Outcome name 4',
            blocks: [
              {
                id: 1,
                type: 'block_1',
                label: 'Outcome name 1'
              },
              {
                id: 2,
                type: 'block_2',
                label: 'Outcome name 2'
              },
              {
                id: 3,
                type: 'block_3',
                label: 'Outcome name 3'
              }
            ]
          },
          {
            id: 5,
            type: 'block_5',
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
            type: 'block_1',
            label: 'Outcome name 1',
            blocks: [
              {
                id: 1,
                type: 'block_1',
                label: 'Outcome name 1',
                blocks: [
                  {
                    id: 1,
                    type: 'block_1',
                    label: 'Outcome name 1'
                  },
                  {
                    id: 2,
                    type: 'block_2',
                    label: 'Outcome name 2'
                  },
                  {
                    id: 3,
                    type: 'block_3',
                    label: 'Outcome name 3'
                  }
                ]
              },
              {
                id: 2,
                type: 'block_2',
                label: 'Outcome name 2'
              },
              {
                id: 3,
                type: 'block_3',
                label: 'Outcome name 3'
              }
            ]
          },
          {
            id: 2,
            type: 'block_2',
            label: 'Outcome name 2',
            blocks: [
              {
                id: 1,
                type: 'block_1',
                label: 'Outcome name 1'
              },
              {
                id: 2,
                type: 'block_2',
                label: 'Outcome name 2'
              },
              {
                id: 3,
                type: 'block_3',
                label: 'Outcome name 3'
              }
            ]
          },
          {
            id: 3,
            type: 'block_3',
            label: 'Outcome name 3'
          },
          {
            id: 4,
            type: 'block_4',
            label: 'Outcome name 4',
            blocks: [
              {
                id: 1,
                type: 'block_1',
                label: 'Outcome name 1'
              },
              {
                id: 2,
                type: 'block_2',
                label: 'Outcome name 2'
              },
              {
                id: 3,
                type: 'block_3',
                label: 'Outcome name 3'
              }
            ]
          },
          {
            id: 5,
            type: 'block_5',
            label: 'Outcome name 5'
          }
        ]
      }
    ]
  },
  restore: {
    title: 'Restore items',
    groups: [
      {
        title: 'Weeks',
        blocks: [
          {
            id: uuidv4(),
            label: 'Week name'
          }
        ]
      },
      {
        title: 'Nodes',
        blocks: [
          {
            id: uuidv4(),
            label: 'Node name here'
          }
        ]
      },
      {
        title: 'Node categories',
        blocks: [
          {
            id: uuidv4(),
            label: 'Node category 1'
          },
          {
            id: uuidv4(),
            label: 'Node category 2'
          },
          {
            id: uuidv4(),
            label: 'Node category 3'
          }
        ]
      },
      {
        title: 'Node links',
        blocks: [
          {
            id: uuidv4(),
            label: 'Node link 1'
          },
          {
            id: uuidv4(),
            label: 'Node link 2'
          }
        ]
      }
    ]
    // readonly: true
  }
}

export default data
