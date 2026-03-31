import { PermissionGroup, ProjectDetailsType } from '@cf/types/common'
import Utility from '@cf/utility/Utility.class'
import type { ProjectDetailOut } from '@XMLHTTP/API/project.rtk'
import { EProject } from '@XMLHTTP/types/entity'

export function formatProjectEntity(project: EProject): ProjectDetailsType {
  const allDisciplines = COURSEFLOW_APP.globalContextData.disciplines

  const formattedDisciplines: string[] = project.disciplines.map((projDisc) => {
    return allDisciplines.find((item) => String(item.id) === String(projDisc))
      ?.title as string
  })

  return {
    uuid: project.id,
    title: project.title,
    description: project.description,
    isFavourite: project.favourite,
    isDeleted: project.deleted,
    created: Utility.formatDate(project.createdOn),
    disciplines: formattedDisciplines,
    // @ts-expect-error TODO: kept objectSets for backwards compatibility, actually use tags
    tags: project.objectSets,
    permissionGroup: project.userPermissions,
    author: project.author
  }
}

/** Map CourseFlow v2 ``GET /api/project/{uuid}`` JSON into the simplified project UI model. */
export function mapProjectV2ToProjectDetails(
  p: ProjectDetailOut
): ProjectDetailsType {
  return {
    uuid: p.uuid,
    title: p.title,
    description: p.description,
    isFavourite: false,
    isDeleted: false,
    created: p.date_created,
    disciplines: [],
    author: {
      id: '',
      username: '',
      firstName: '',
      lastName: '',
      name: ''
    },
    permissionGroup: PermissionGroup.NONE
  }
}
