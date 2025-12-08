import { ObjectSetType, ProjectDetailsType } from '@cf/types/common'
import Utility from '@cf/utility/Utility.class'
import { EProject } from '@XMLHTTP/types/entity'

export function formatProjectEntity(project: EProject): ProjectDetailsType {
  const allDisciplines = COURSEFLOW_APP.globalContextData.disciplines

  // console.log(allDisciplines)
  // console.log(project)

  const formattedDisciplines: string[] = project.disciplines.map((projDisc) => {
    return allDisciplines.find((item) => item.id === projDisc).title
  })

  const formattedObjectSets: ObjectSetType[] = project.objectSets.map(
    (item) => {
      return {
        id: item.id,
        title: item.title,
        term: 'we actually dont use this anymore?' // TODO
      }
    }
  )

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    isFavourite: project.favourite,
    isDeleted: project.deleted,
    created: Utility.formatDate(project.createdOn),
    disciplines: formattedDisciplines,
    objectSets: formattedObjectSets,
    permissionGroup: project.userPermissions,
    author: project.author
  }
}
