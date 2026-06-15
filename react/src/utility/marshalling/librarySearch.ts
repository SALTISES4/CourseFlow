import {
  LibraryContentTypeOut,
  LibraryItemOut,
  LibrarySearchIn
} from '@cf/api/gen'
import { ObjectPermission } from '@cf/types/common'
import { LibraryObjectType } from '@cf/types/enum'
import { ELibraryObject, EUser } from '@XMLHTTP/types/entity'

type LibraryObjectsSearchQueryResp = {
  dataPackage: {
    items: ELibraryObject[]
    meta: {
      currentPage: number
      count: number
      pageCount: number
    }
  }
}

type LibrarySearchMetaRaw = {
  total_results: number
  page_count: number
  current_page: number
  results_per_page: number
}

type LibrarySearchResponseRaw = {
  items: LibraryItemOut[]
  meta: LibrarySearchMetaRaw
}

const emptyAuthor: EUser = {
  uuid: '',
  username: '',
  firstName: '',
  lastName: '',
  name: ''
}

export function mapObjectTypeToLibraryObjectType(
  contentType: LibraryContentTypeOut,
  label: string
): LibraryContentTypeOut {
  if (contentType === 'project') {
    return LibraryContentTypeOut.PROJECT
  }

  const validTypes = {
    program: LibraryObjectType.PROGRAM,
    course: LibraryObjectType.COURSE,
    activity: LibraryObjectType.ACTIVITY,
    task: LibraryObjectType.TASK
  }

  return validTypes[label] ?? LibraryObjectType.COURSE
}

/**
 * Navigation uuid: project UUID for projects; workflow UUID for unit-backed rows
 * (matches `useNavigateToLibraryItem` + workflow routes).
 */
function mapLibraryItemToELibraryObject(item: LibraryItemOut): ELibraryObject {
  const { uuid, title, description, isTemplate, isFavorite } = item

  return {
    uuid,
    title,
    description,
    isTemplate,
    isFavorite,
    hash: '',
    deleted: false,
    deletedOn: '',
    createdOn: item.dateCreated,
    lastModified: item.modifiedOn,
    author: emptyAuthor,
    published: false,
    type: mapObjectTypeToLibraryObjectType(item.contentType, item.label),
    projectTitle: '',
    objectPermission: { permissionType: 0, roleType: 0 } as ObjectPermission,
    workflowCount: 0,
    isOwned: true,
    isStrategy: false,
    isLinked: false,
    isVisible: true
  }
}

export function buildLibrarySearchRequestBody(
  args: LibrarySearchIn
): Record<string, unknown> {
  const pagination = args.pagination ?? { page: 0 }
  const sort = args.sort ?? undefined
  const filters = args.filters ?? undefined

  const body: Record<string, unknown> = {
    pagination: {
      page: pagination.page ?? 0,
      results_per_page: pagination.resultsPerPage ?? 10
    }
  }
  if (sort) {
    body.sort = {
      value: sort.value,
      direction: sort.direction
    }
  }
  if (filters) {
    body.filters = filters
  }
  return body
}

export function transformLibrarySearchResponseToLegacy(
  raw: unknown
): LibraryObjectsSearchQueryResp {
  if (!raw || typeof raw !== 'object') {
    return {
      dataPackage: {
        items: [],
        meta: { currentPage: 0, pageCount: 0, count: 0 }
      }
    }
  }

  const r = raw as Partial<LibrarySearchResponseRaw>
  const itemsRaw = Array.isArray(r.items) ? r.items : []
  const items = itemsRaw.map((row) => mapLibraryItemToELibraryObject(row))
  const meta = r.meta

  return {
    dataPackage: {
      items,
      meta: {
        currentPage: Number(meta?.current_page ?? 0),
        pageCount: Number(meta?.page_count ?? 0),
        count: Number(meta?.total_results ?? 0)
      }
    }
  }
}
