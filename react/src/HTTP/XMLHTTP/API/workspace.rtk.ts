import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType, LibraryObjectType, WorkspaceType } from '@cf/types/enum'
import Utility from '@cf/utility/Utility.class'
import { Verb, cfApi } from '@XMLHTTP/API/api'
import { API_POST } from '@XMLHTTP/CallWrapper'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { generatePath } from 'react-router-dom'

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
        id: string
        payload: {
          objectType: CfObjectType
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
        id: string
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
    /*******************************************************
     *  OBJECTS
     *******************************************************/
    // only outcomes
    insertChild: builder.mutation<
      EmptyPostResp,
      {
        payload: {
          id: string
          objectType: CfObjectType
        }
      }
    >({
      query: (args) => {
        const url = apiPaths.json_api.workflow.object__insert_child
        return {
          method: Verb.POST,
          url,
          body: args.payload
        }
      }
    }),
    insertSibling: builder.mutation<
      EmptyPostResp,
      {
        payload: {
          id: string
          objectType: CfObjectType
          parentid: string
          parentType: CfObjectType
          throughType: CfObjectType
        }
      }
    >({
      query: (args) => {
        const url = apiPaths.json_api.workflow.object__insert_child
        return {
          method: Verb.POST,
          url,
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
  useInsertChildMutation,
  useInsertSiblingMutation
} = extendedApi

/*******************************************************
 * LEGACY / PROCEDURAL
 * these are api requests left over from the legacy structure which are
 * still being used while we finish transitioning from classes
 *******************************************************/

/*******************************************************
 * CONTEXTUAL EDIT HOVER MENU
 * - API actions for editing, deleting, restoring, duplicating etc.
 *  generic node objects
 *    - column
 *    - node
 *    - week
 *
 *******************************************************/

/**
 * deleteSelfQueryLegacy
 **/
export function deleteSelfQueryLegacy(
  objectid: string,
  objectType: CfObjectType,
  soft = false,
  callBackFunction = (_data: EmptyPostResp) => Utility.logger('success')
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

/**
 * restoreSelfQueryLegacy
 **/
export function restoreSelfQueryLegacy(
  objectid: string,
  objectType: CfObjectType,
  callBackFunction = (_data: EmptyPostResp) => Utility.logger('success')
) {
  const base = apiPaths.json_api.workspace.restore
  const url = generatePath(base, { id: objectId })

  API_POST(url, {
    objectType: objectType
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}



//Causes the specified object to insert a sibling after itself
export function duplicateSelfQuery(
  objectid: string,
  objectType: CfObjectType,
  parentid: string,
  parentType: CfObjectType,
  throughType: CfObjectType,
  callBackFunction = (_data: EmptyPostResp) => Utility.logger('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.duplicate_self, {
    parentId: parentId,
    parentType: parentType,
    objectId: objectId,
    objectType: objectType,
    throughType: throughType
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}
