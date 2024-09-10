import { Discipline } from '@cf/types/common'
import { _t } from '@cf/utility/utilityFunctions'
import { EProject } from '@XMLHTTP/types/entity'

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
