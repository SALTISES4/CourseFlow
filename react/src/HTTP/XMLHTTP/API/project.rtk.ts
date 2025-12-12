import { apiPaths } from '@cf/router/apiRoutes'
import { Verb, cfApi } from '@XMLHTTP/API/api'
import { ELibraryObject, EProject } from '@XMLHTTP/types/entity'
import { generatePath } from 'react-router-dom'

/*******************************************************
 * TYPES
 *******************************************************/
export type GetProjectByIdQueryResp = {
  message: string
  dataPackage: EProject
}

export type ListProjectsQueryResp = {
  message: string
  dataPackage: {
    ownedProjects: ELibraryObject[]
    editProjects: ELibraryObject[]
    deletedProjects: ELibraryObject[]
  }
}

export type CreateProjectResp = {
  message: string
  dataPackage: {
    id: number
  }
}

export interface CreateProjectArgs {
  description: string
  title: string
  disciplines: number[]
}
export interface UpdateProjectArgs extends CreateProjectArgs {
  id: number
}

/*******************************************************
 * QUERIES
 *******************************************************/
const extendedApi = cfApi.injectEndpoints({
  endpoints: (builder) => ({
    /*******************************************************
     * QUERIES
     *******************************************************/
    getProjectById: builder.query<
      GetProjectByIdQueryResp,
      {
        id: number
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.project.detail
        console.log('getting project by id', args.id, 'base', base)
        return {
          method: Verb.GET,
          url: generatePath(base, { id: args.id })
        }
      }
    }),
    // @todo this query is probably better as a variation on common library search + arguments
    listProjectsByCurrentUser: builder.query<ListProjectsQueryResp, any>({
      query: (args) => {
        const base = apiPaths.json_api.project.list__by_current_user
        return {
          method: Verb.POST,
          url: base,
          body: args // not implemented
        }
      }
    }),
    /*******************************************************
     * MUTATIONS
     *******************************************************/
    createProject: builder.mutation<CreateProjectResp, CreateProjectArgs>({
      query: (args) => {
        const url = apiPaths.json_api.project.create
        return {
          method: Verb.POST,
          url,
          body: args
        }
      }
    }),
    updateProject: builder.mutation<CreateProjectResp, UpdateProjectArgs>({
      query: (args) => {
        const base = apiPaths.json_api.project.update
        const url = generatePath(base, { id: args.id })
        return {
          method: Verb.POST,
          url,
          body: args
        }
      }
    }),
    duplicateProject: builder.mutation<CreateProjectResp, { id: number }>({
      query: (args) => {
        const base = apiPaths.json_api.project.update
        const url = generatePath(base, { id: args.id })
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
  useGetProjectByIdQuery,
  // not sure we need this any more
  useListProjectsByCurrentUserQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDuplicateProjectMutation
} = extendedApi
