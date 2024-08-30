import { EProject } from '@XMLHTTP/types/entity'

const data: EProject = {
  author: 'Johnzy',
  author_id: 3,
  created_on: new Date(),
  deleted_on: new Date(),
  deleted: false,
  title: 'This is da project title',
  description: 'Well well well',
  disciplines: [],
  favourite: true,
  id: 12,
  last_modified: 'Yesterday',
  object_permission: {
    permission_type: 1,
    role_type: 2,
    last_viewed: new Date()
  },
  object_sets: [
    {
      id: 3,
      title: 'First object set'
    },
    {
      id: 1,
      title: 'Another object set'
    },
    {
      id: 2,
      title: 'Hello'
    }
  ],
  published: true,
  type: 'project',
  workflowproject_set: []
}

export default data
