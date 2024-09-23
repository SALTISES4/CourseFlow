import { Discipline, ProjectDetailsType } from '@cf/types/common'
import { formatDate } from '@cf/utility/utilityFunctions'
import { ObjectSetType } from '@cfPages/Styleguide/views/Project/types'
import { EProject } from '@XMLHTTP/types/entity'

export function formatProjectEntity(
  project: EProject,
  allDisciplines: Discipline[]
): ProjectDetailsType {

  console.log('project')
  console.log(project)

  const formattedDisciplines: string[] = project.disciplines.map((projDisc) => {
    return allDisciplines.find((item) => item.id === projDisc).title
  })

  const formattedObjectSets: ObjectSetType[] = project.objectSets.map(
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
    created: formatDate(project.createdOn),
    disciplines: formattedDisciplines,
    objectSets: formattedObjectSets
  }
}
