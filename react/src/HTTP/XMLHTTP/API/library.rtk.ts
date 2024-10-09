import { apiPaths } from '@cf/router/apiRoutes'
import {
  LibraryObjectsSearchQueryArgs,
  ToggleFavouriteMutationArgs
} from '@XMLHTTP/types/args'
import { ELibraryObject } from '@XMLHTTP/types/entity'
import {
  EmptyPostResp,
  PageHomeQueryResp,
  PageLibraryQueryResp
} from '@XMLHTTP/types/query'

import { Verb, cfApi } from './api'

/*******************************************************
 * TYPE
 *******************************************************/
export type LibraryObjectsSearchQueryResp = {
  message: string
  dataPackage: {
    items: ELibraryObject[]
    meta: {
      count: number
      pageCount: number
    }
  }
}

/*******************************************************
 * QUERY
 *******************************************************/
const extendedApi = cfApi.injectEndpoints({
  endpoints: (builder) => ({
    /*******************************************************
     * QUERIES
     *******************************************************/
    getHomeContext: builder.query<PageHomeQueryResp, void>({
      query: () => {
        return {
          method: Verb.GET,
          url: apiPaths.json_api.library.home
        }
      }
    }),
    libraryObjectsSearch: builder.query<
      LibraryObjectsSearchQueryResp,
      LibraryObjectsSearchQueryArgs
    >({
      query: (args) => {
        return {
          method: Verb.POST,
          url: apiPaths.json_api.library.library__objects_search,
          body: args
        }
      }
    }),
    libraryFavouriteObjects: builder.query<LibraryObjectsSearchQueryResp, void>(
      {
        query: () => {
          return apiPaths.json_api.library.library__favourites__projects
        }
      }
    ),
    /*******************************************************
     * MUTATIONS
     *******************************************************/
    toggleFavourite: builder.mutation<
      EmptyPostResp,
      ToggleFavouriteMutationArgs
    >({
      query: (args) => {
        return {
          method: Verb.POST,
          url: apiPaths.json_api.library.library__toggle_favourite__post,
          body: args
        }
      }
    })
  }),
  overrideExisting: false
})

export const {
  useGetHomeContextQuery,
  useLibraryObjectsSearchQuery,
  useLibraryFavouriteObjectsQuery,
  useToggleFavouriteMutation
} = extendedApi
