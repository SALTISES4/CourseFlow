import { apiPaths } from '@cf/router/apiRoutes'
import { Verb, cfApi } from '@XMLHTTP/API/api'
import {
  LibraryObjectsSearchQueryArgs,
  ToggleFavouriteMutationArgs
} from '@XMLHTTP/types/args'
import {
  EmptyPostResp,
  PageHomeQueryResp,
  type LibraryObjectsSearchQueryResp
} from '@XMLHTTP/types/query'
import {
  buildV2LibrarySearchRequestBody,
  transformV2LibrarySearchResponseToLegacy
} from '@cf/utility/marshalling/libraryV2Search'

export type { LibraryObjectsSearchQueryResp } from '@XMLHTTP/types/query'

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
          url: apiPaths.json_api_v2.library.search,
          body: buildV2LibrarySearchRequestBody(args)
        }
      },
      transformResponse: transformV2LibrarySearchResponseToLegacy
    }),
    /** Favourites strip in sidebar — same v2 search with `favourited: true`. */
    libraryFavouriteObjects: builder.query<LibraryObjectsSearchQueryResp, void>(
      {
        query: () => {
          return {
            method: Verb.POST,
            url: apiPaths.json_api_v2.library.search,
            body: buildV2LibrarySearchRequestBody({
              pagination: { page: 0, resultsPerPage: 10 },
              filters: [{ name: 'favourited', value: true }]
            })
          }
        },
        transformResponse: transformV2LibrarySearchResponseToLegacy
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
