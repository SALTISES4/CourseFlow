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
    isFavourite: p.isFavourite,
    isDeleted: false,
    created: p.dateCreated,
    disciplines: [],
    author: {
      uuid: '',
      username: '',
      firstName: '',
      lastName: '',
      name: ''
    }
  }
}
