import {Discipline} from '@cfModule/types/common'
import {EProject} from '@XMLHTTP/types/entity'

export type ProjectViewDTO = {
  project_data: EProject
  user_permission: number // not always
  disciplines: Discipline[]
  user_id: number
  user_role: number
  user_name: string
  is_strategy: boolean
  public_view: boolean
  changeFieldID: number
  myColour: string
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
  project: EProject
  userId: number
  projectPaths
  allDisciplines
  readOnly
}

export type RenderProps = {
  project_data: EProject
  user_permission: number
  disciplines: Discipline[]
  user_id: number
}

// export type ProjectData = {
//   author: string
//   author_id: number
//   created_on: string
//   deleted: boolean
//   deleted_on: string
//   description: string
//   disciplines: Discipline[] // @todo this might be just ints / IDS
//   favourite: boolean
//   id: number
//   last_modified: string
//   liveproject: null
//   object_permission: ObjectPermission
//   object_sets: any[]
//   published: boolean
//   title: string
//   type: string
//   workflowproject_set: number[]
// }
