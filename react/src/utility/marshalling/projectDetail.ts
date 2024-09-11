import { Discipline, ProjectDetailsType } from '@cf/types/common'
import { formatDate } from '@cf/utility/utilityFunctions'
import { ObjectSetType } from '@cfPages/Styleguide/views/Project/types'
import { EProject } from '@XMLHTTP/types/entity'

export function formatProjectEntity(
  project: EProject,
  allDisciplines: Discipline[]
): ProjectDetailsType {
  const formattedDisciplines: string[] = project.disciplines.map((projDisc) => {
    return allDisciplines.find((item) => item.id === projDisc).title
  })

  const formattedObjectSets: ObjectSetType[] = project.object_sets.map(
    (item) => {
      return {
        title: item.title,
        type: item.term
      }
    }
  )

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    isFavorite: project.favourite,
    created: formatDate(project.created_on),
    disciplines: formattedDisciplines,
    objectSets: formattedObjectSets
  }
}
