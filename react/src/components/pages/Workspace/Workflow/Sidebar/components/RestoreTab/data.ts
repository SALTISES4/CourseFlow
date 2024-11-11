import { v4 as uuidv4 } from 'uuid'

import { RestoreTabType } from '../../types'

const data: RestoreTabType = {
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
}

export default data
