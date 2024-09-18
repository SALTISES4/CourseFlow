// @ts-nocheck
import { EProject } from '@XMLHTTP/types/entity'

const data: EProject = {
  author: 'Johnzy',
  authorId: 3,
  createdOn: new Date(),
  deletedOn: new Date(),
  deleted: false,
  title: 'This is da project title',
  description: 'Well well well',
  disciplines: [],
  favourite: true,
  id: 12,
  lastModified: 'Yesterday',
  objectPermission: {
    permissionType: 1,
    role_type: 2,
    lastViewed: new Date()
  },
  objectSets: [
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
  workflowprojectSet: []
}

export default data
