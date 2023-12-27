import { Discipline } from '@cfModule/types/common'

export type ProjectViewDTO = {
  project_data: ProjectData
  user_role: number
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
  renderer: ProjectRenderer
  userId: number
  projectPaths
  allDisciplines
  userRole
  readOnly
}

export type ProjectRenderer = {
  allDisciplines: Discipline[]
  projectData: ProjectData
  context: any
  props: RenderProps
  userId: number
  user_permissions: number
  user_role: number
  read_only: boolean
  create_path_this_project: {
    activity: string
    course: string
    program: string
  }
}

export type RenderProps = {
  project_data: ProjectData
  user_role: number
  user_permission: number
  disciplines: Discipline[]
  user_id: number
}

export type Discipline = {
  id: number
  title: string
}

export type ProjectData = {
  author: string
  author_id: number
  created_on: string
  deleted: boolean
  deleted_on: string
  description: string
  disciplines: any[]
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
