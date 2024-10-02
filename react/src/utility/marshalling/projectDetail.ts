import { Discipline, ObjectSetType, ProjectDetailsType } from '@cf/types/common'
import { formatDate } from '@cf/utility/utilityFunctions'
import { EProject } from '@XMLHTTP/types/entity'

export function formatProjectEntity(
  project: EProject,
  allDisciplines: Discipline[]
): ProjectDetailsType {
  const formattedDisciplines: string[] = project.disciplines.map((projDisc) => {
    return allDisciplines.find((item) => item.id === projDisc).title
  })

  const formattedObjectSets: ObjectSetType[] = project.objectSets.map(
    (item) => {
      return {
        id: item.id,
        title: item.title,
        term: item.term
      }
    }
  )

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    isFavorite: project.favourite,
    isDeleted: project.deleted,
    created: formatDate(project.createdOn),
    disciplines: formattedDisciplines,
    objectSets: formattedObjectSets
  }
}
