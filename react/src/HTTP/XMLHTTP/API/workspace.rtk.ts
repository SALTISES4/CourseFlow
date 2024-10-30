import { apiPaths } from '@cf/router/apiRoutes'
import { LibraryObjectType, WorkspaceType } from '@cf/types/enum'
import { API_POST } from '@XMLHTTP/CallWrapper'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { generatePath } from 'react-router-dom'

import { Verb, cfApi } from './api'

/*******************************************************
 * TYPES
 *******************************************************/

/*******************************************************
 * QUERIES
 *******************************************************/
const extendedApi = cfApi.injectEndpoints({
  endpoints: (builder) => ({
    /*******************************************************
     * MUTATION
     *******************************************************/
    archive: builder.mutation<
      EmptyPostResp,
      {
        id: number
        payload: {
          objectType: WorkspaceType
        }
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.workspace.delete_soft
        return {
          method: Verb.POST,
          url: generatePath(base, { id: args.id }),
          body: args.payload
        }
      }
    }),
    unarchive: builder.mutation<
      EmptyPostResp,
      {
        id: number
        payload: {
          objectType: WorkspaceType
        }
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.workspace.restore
        return {
          method: Verb.POST,
          url: generatePath(base, { id: args.id }),
          body: args.payload
        }
      }
    }),
    deleteSelfHard: builder.mutation<
      EmptyPostResp,
      {
        id: number
        payload: {
          objectType: LibraryObjectType
        }
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.workspace.delete
        return {
          method: Verb.POST,
          url: generatePath(base, { id: args.id }),
          body: args.payload
        }
      }
    })
  }),
  overrideExisting: false
})

export const {
  useArchiveMutation,
  useUnarchiveMutation,
  useDeleteSelfHardMutation
} = extendedApi

/*******************************************************
 * LEGACY / PROCEDURAL
 * these are api requests left over from the legacy structure which are
 * still being used while we finish transitioning from classes
 *******************************************************/
export function deleteSelfQueryLegacy(
  objectId: number,
  objectType: any,
  soft = false,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  const urlHard = apiPaths.json_api.workspace.delete
  const urlSoft = apiPaths.json_api.workspace.delete_soft
  const base = soft ? urlSoft : urlHard
  const url = generatePath(base, { id: objectId })

  API_POST(url, {
    objectType: objectType
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}

export function restoreSelfQueryLegacy(
  objectId: number,
  objectType: any,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  const base = apiPaths.json_api.workspace.restore
  const url = generatePath(base, { id: objectId })

  API_POST(url, {
    objectType: objectType
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}
