// @ts-nocheck
import { ProjectDetailsType, ProjectPermissionRole } from './types'

const data: ProjectDetailsType = {
  id: '10',
  title: 'Project title goes here',
  description:
    'gone treated beauty future science bread variety gravity fruit wood buffalo addition sit half fog on them railroad facing various grabbed driving mail written',
  created: 'June 20th, 2024',
  disciplines: ['Biology', 'Chemistry', 'Physics'],
  permissions: [
    {
      id: '12313',
      name: 'Xin Yue',
      email: 'xin@xueeee.com',
      role: ProjectPermissionRole.OWNER
    },
    {
      id: '1',
      name: 'Joe Shmoe',
      email: 'joey@shmoey.com',
      role: ProjectPermissionRole.EDITOR
    },
    {
      id: '2',
      name: 'Gustavo Johansson',
      email: 'gus@joh.com',
      role: ProjectPermissionRole.VIEWER
    }
  ],
  objectSets: [
    {
      title: 'Object set name here',
      type: 'Program node'
    },
    {
      title: 'Something else',
      type: 'Course outcome'
    },
    {
      title: 'And now another',
      type: 'Activity node'
    }
  ]
}

export default data
