import { Discipline } from '@cf/types/common'
import { _t } from '@cf/utility/utilityFunctions'
import { EProject } from '@XMLHTTP/types/entity'



export type ObjectPermission = {
  permissionType: number
  lastViewed: Date
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
  projectData: EProject
  userPermission: number
  disciplines: Discipline[]
  userId: number
}
