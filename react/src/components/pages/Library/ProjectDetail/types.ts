import { Discipline } from '@cfModule/types/common'

export type ProjectViewDTO = {
  project_data: ProjectData
  user_permission: number
  disciplines: Discipline[]
  user_id: number
  create_path_this_project: {
    activity: string
    course: string
    program: string
  }
}

export type ObjectPermission = {
  permission_type: number
  last_viewed: Date
}

/*******************************************************
 *
 *******************************************************/

export type ProjectMenuProps = {
  data: ProjectData
  userId: number
  projectPaths
  allDisciplines
  readOnly
}

export type RenderProps = {
  project_data: ProjectData
  user_permission: number
  disciplines: Discipline[]
  user_id: number
}

export type ProjectData = {
  author: string
  author_id: number
  created_on: string
  deleted: boolean
  deleted_on: string
  description: string
  disciplines: Discipline[] // @todo this might be just ints / IDS
  favourite: boolean
  id: number
  last_modified: string
  liveproject: null
  object_permission: ObjectPermission
  object_sets: any[]
  published: boolean
  title: string
  type: string
  workflowproject_set: number[]
}
