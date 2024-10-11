import { PermissionGroup, ProjectDetailsType } from '@cf/types/common'

const data: ProjectDetailsType = {
  id: 10,
  title: 'Project title goes here',
  description:
    'gone treated beauty future science bread variety gravity fruit wood buffalo addition sit half fog on them railroad facing various grabbed driving mail written',
  created: 'June 20th, 2024',
  disciplines: ['Biology', 'Chemistry', 'Physics'],
  isFavorite: true,
  isDeleted: false,
  permissions: [
    {
      id: 12313,
      name: 'Xin Yue',
      email: 'xin@xueeee.com',
      permissionGroup: PermissionGroup.OWNER
    },
    {
      id: 1,
      name: 'Joe Shmoe',
      email: 'joey@shmoey.com',
      permissionGroup: PermissionGroup.EDIT
    },
    {
      id: 2,
      name: 'Gustavo Johansson',
      email: 'gus@joh.com',
      permissionGroup: PermissionGroup.VIEW
    }
  ],
  objectSets: [
    {
      title: 'Object set name here',
      term: 'Program node'
    },
    {
      title: 'Something else',
      term: 'Course outcome'
    },
    {
      title: 'And now another',
      term: 'Activity node'
    }
  ]
}

export default data
