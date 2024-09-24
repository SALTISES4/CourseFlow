import { apiPaths } from '@cf/router/apiRoutes'
import { CreateProjectArgs } from '@XMLHTTP/types/args'
import { EProject } from '@XMLHTTP/types/entity'
import { generatePath } from 'react-router-dom'

import { Verb, cfApi } from './api'

/*******************************************************
 * TYPES
 *******************************************************/
export type GetProjectByIdQueryResp = {
  message: string
  dataPackage: EProject
}

export type CreateProjectResp = {
  message: string
  dataPackage: {
    id: number
  }
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
        return {
          method: Verb.GET,
          url: generatePath(base, { id: args.id })
        }
      }
    }),
    /*******************************************************
     * MUTATIONS
     *******************************************************/
    createProject: builder.mutation<CreateProjectResp, CreateProjectArgs>({
      query: (args) => {
        const base = apiPaths.json_api.workflow.update
        return {
          method: Verb.POST,
          url: apiPaths.json_api.project.create,
          body: args
        }
      }
    })
  }),
  overrideExisting: false
})

export const { useGetProjectByIdQuery, useCreateProjectMutation } = extendedApi
