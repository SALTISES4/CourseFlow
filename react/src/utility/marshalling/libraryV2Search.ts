/**
 * Maps CourseFlow v2 `POST /api/library/search` JSON to the legacy library
 * envelope expected by LibrarySearchView / Sidebar (`dataPackage` + `ELibraryObject`).
 */
import { LibrarySearchIn } from '@cf/api/gen'
import { ObjectPermission } from '@cf/types/common'
import { LibraryObjectType } from '@cf/types/enum'
import { ELibraryObject, EUser } from '@XMLHTTP/types/entity'
import type { LibraryObjectsSearchQueryResp } from '@XMLHTTP/types/query'

/** Raw item from Django Ninja `LibraryItemOut` (snake_case JSON). */
export type V2LibraryItemRaw = {
  uuid: string
  content_type: 'project' | 'workflow'
  label: string
  title: string
  description: string
  date_created: string
  modified_on: string
  is_template: boolean
  is_favorite: boolean
}

export type V2LibrarySearchMetaRaw = {
  total_results: number
  page_count: number
  current_page: number
  results_per_page: number
}

export type V2LibrarySearchResponseRaw = {
  items: V2LibraryItemRaw[]
  meta: V2LibrarySearchMetaRaw
}

const emptyAuthor = (): EUser => ({
  uuid: '',
  username: '',
  firstName: '',
  lastName: '',
  name: ''
})

export function mapObjectTypeToLibraryObjectType(
  contentType: string,
  label: string
): LibraryObjectType {
  if (contentType === 'project') {
    return LibraryObjectType.PROJECT
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
export function mapV2LibraryItemToELibraryObject(
  item: V2LibraryItemRaw
): ELibraryObject {
  const isProject = item.content_type === 'project'
  const id = String(item.uuid ?? '')

  return {
    uuid: id,
    hash: '',
    deleted: false,
    deletedOn: '',
    createdOn: item.date_created,
    lastModified: item.modified_on,
    title: item.title,
    description: item.description ?? '',
    author: emptyAuthor(),
    favourite: item.is_favorite,
    published: false,
    type: isProject
      ? LibraryObjectType.PROJECT
      : mapObjectTypeToLibraryObjectType(item.content_type, item.label),
    isOwned: true,
    isStrategy: false,
    projectTitle: '',
    objectPermission: { permissionType: 0, roleType: 0 } as ObjectPermission,
    workflowCount: 0,
    isLinked: false,
    isVisible: true,
    isTemplate: item.is_template
  }
}

export function buildV2LibrarySearchRequestBody(
  args: LibrarySearchIn | Record<string, never>
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

export function transformV2LibrarySearchResponseToLegacy(
  raw: unknown
): LibraryObjectsSearchQueryResp {
  if (!raw || typeof raw !== 'object') {
    return {
      message: '',
      dataPackage: {
        items: [],
        meta: { currentPage: 0, pageCount: 0, count: 0 }
      }
    }
  }

  const r = raw as Partial<V2LibrarySearchResponseRaw>
  const itemsRaw = Array.isArray(r.items) ? r.items : []
  const items = itemsRaw.map((row) => mapV2LibraryItemToELibraryObject(row))
  const meta = r.meta

  return {
    message: 'ok',
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
