import { ProjectDetailOut } from '@cf/api/gen'
import { ProjectDetailsType } from '@cf/types/common'

/**
 * Map GET /api/project/{uuid} JSON into the simplified project UI model.
 */
export function mapProjectV2ToProjectDetails(
  p: ProjectDetailOut
): ProjectDetailsType {
  return {
    uuid: p.uuid,
    title: p.title,
    description: p.description,
    isFavorite: p.isFavorite,
    isDeleted: p.isArchived,
    isPublished: p.isPublished,
    isArchived: p.isArchived,
    permissions: p.permissions,
    created: p.dateCreated,
    disciplines: p.disciplines.map((discipline) => discipline.label),
    author: {
      uuid: '',
      username: '',
      firstName: '',
      lastName: '',
      name: ''
    }
  }
}
