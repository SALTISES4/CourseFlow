import { apiPaths } from '@cf/router/apiRoutes'
import { Verb, cfApi } from '@XMLHTTP/API/api'
import { ELibraryObject } from '@XMLHTTP/types/entity'
import { generatePath } from 'react-router-dom'

/*******************************************************
 * TYPES
 *******************************************************/
/** CourseFlow v2 ``ProjectDetailOut`` (GET/POST /api/project). */
export type ProjectDetailOut = {
  uuid: string
  title: string
  description: string
  is_published: boolean
  is_template: boolean
  owner_id: number
  date_created: string
  modified_on: string
}

export type ProjectDetailOutResp = {
  item: ProjectDetailOut
}

export type ProjectLibraryResp = {
  owned: ELibraryObject[]
  editable: ELibraryObject[]
  deleted: ELibraryObject[]
}

type LegacyProjectLibraryEnvelope = {
  message?: string
  dataPackage: {
    ownedProjects: ELibraryObject[]
    editProjects: ELibraryObject[]
    deletedProjects: ELibraryObject[]
  }
}

export type CreateProjectResp = ProjectDetailOut

export interface CreateProjectArgs {
  description: string
  title: string
  disciplines: number[]
}
export interface UpdateProjectArgs extends CreateProjectArgs {
  projectUuid: string
}

/*******************************************************
 * QUERIES
 *******************************************************/
const extendedApi = cfApi.injectEndpoints({
  endpoints: (builder) => ({
    /*******************************************************
     * QUERIES
     *******************************************************/
    getProjectByUuid: builder.query<
      ProjectDetailOutResp,
      { projectUuid: string }
    >({
      query: (args) => {
        const base = apiPaths.json_api_v2.project.detail
        return {
          method: Verb.GET,
          url: generatePath(base, { uuid: args.projectUuid })
        }
      }
    }),
    // @todo this query is probably better as a variation on common library search + arguments
    listProjectsByCurrentUser: builder.query<ProjectLibraryResp, any>({
      query: (args) => {
        const base = apiPaths.json_api.project.list__by_current_user
        return {
          method: Verb.POST,
          url: base,
          body: args // not implemented
        }
      },
      transformResponse: (
        response: LegacyProjectLibraryEnvelope
      ): ProjectLibraryResp => ({
        owned: response.dataPackage.ownedProjects,
        editable: response.dataPackage.editProjects,
        deleted: response.dataPackage.deletedProjects
      })
    }),
    /*******************************************************
     * MUTATIONS
     *******************************************************/
    createProject: builder.mutation<CreateProjectResp, CreateProjectArgs>({
      query: (args) => {
        const url = apiPaths.json_api_v2.project.collection
        return {
          method: Verb.POST,
          url,
          body: args
        }
      }
    }),
    updateProject: builder.mutation<CreateProjectResp, UpdateProjectArgs>({
      query: (args) => {
        const base = apiPaths.json_api_v2.project.detail
        const url = generatePath(base, { uuid: args.projectUuid })
        return {
          method: Verb.POST,
          url,
          body: args
        }
      }
    }),
    duplicateProject: builder.mutation<CreateProjectResp, { projectUuid: string }>({
      query: (args) => {
        const base = apiPaths.json_api_v2.project.detail
        const url = generatePath(base, { uuid: args.projectUuid })
        return {
          method: Verb.POST,
          url
        }
      }
    })
  }),
  overrideExisting: false
})

export const {
  useGetProjectByUuidQuery,
  // not sure we need this any more
  useListProjectsByCurrentUserQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDuplicateProjectMutation
} = extendedApi
