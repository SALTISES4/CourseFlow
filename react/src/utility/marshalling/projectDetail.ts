import { ProjectDetailsType } from '@cf/types/common'
import Utility from '@cf/utility/Utility.class'
import { EProject } from '@XMLHTTP/types/entity'

export function formatProjectEntity(project: EProject): ProjectDetailsType {
  const allDisciplines = COURSEFLOW_APP.globalContextData.disciplines

  // console.log(allDisciplines)
  // console.log(project)

  const formattedDisciplines: string[] = project.disciplines.map((projDisc) => {
    return allDisciplines.find((item) => item.id === projDisc).title
  })

  return {
    id: project.id,
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
