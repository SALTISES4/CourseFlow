import { EProject } from '@XMLHTTP/types/entity'
import { formatDate } from '@cf/utility/utilityFunctions'
import { ProjectDetailsType } from '@cf/types/common'

export function formatProjectEntity(project: EProject): ProjectDetailsType {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    isFavorite: project.favourite,
    created: formatDate(project.created_on),
    disciplines: project.disciplines.map((item) => {
      return item.title
    })
  }
}
