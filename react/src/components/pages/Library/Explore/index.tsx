import { _t } from '@cf/utility/utilityFunctions'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { useQuery } from '@tanstack/react-query'
import { libraryObjectsSearchQuery } from '@XMLHTTP/API/library'
import { LibraryObjectsSearchQueryArgs } from '@XMLHTTP/types/args'
import { LibraryObjectsSearchQueryResp } from '@XMLHTTP/types/query'
import * as React from 'react'
import { useMemo, useState } from 'react'

import LibrarySearchView, {
  SearchOptionsState
} from 'components/views/LibrarySearchView'

/*
 * @todo
 *   1 -- the filters are not connected properly to the backend query
 *   2 -- the library seach view needs to be more flexible / dynamic for filter type config
 *      see: https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow---V2?node-id=1181-17902&node-type=FRAME&t=rIPGYwZ2k9mYfbzx-0
 *      we need to add some data in our defaultOptionsSearchOptions config about filter/sort types
 *     - search/ keywrod input
 *           select list with inplace, within list filtering (i.e. disciplies) that have multiple allowable options at once
 *     - binary on off button filter (template)
 *     - simple list filter (type)
 *     - sort (relevance)
 * */
const defaultOptionsSearchOptions: SearchOptionsState = {
  page: 0,
  sortOptions: [
    {
      name: 'recent',
      label: 'Recent'
    },
    {
      name: 'a-z',
      label: 'A - Z'
    },
    {
      name: 'date',
      label: 'Creation date'
    }
  ],
  filterGroups: {
    keyword: [
      {
        name: 'keyword',
        label: _t('search'),
        value: ''
      }
    ],
    filterOptions: [
      {
        name: 'all',
        label: _t('All'),
        value: null,
        enabled: true
      },
      {
        name: 'owned',
        label: _t('Owned'),
        value: true
      },
      {
        name: 'shared',
        label: _t('Shared'),
        value: true
      },
      {
        name: 'favorites',
        label: _t('Favorites'),
        value: true
      },
      {
        name: 'archived',
        label: _t('Archived'),
        value: true
      }
    ],
    templateOptions: [
      {
        name: 'isTemplate',
        label: _t('template'),
        value: true
      }
    ]
  }
}
const ExplorePage = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/

  const [searchArgs, setSearchArgs] = useState<LibraryObjectsSearchQueryArgs>(
    {}
  )

  const {
    data: libData,
    error: libError,
    isLoading: libIsLoading,
    isError: libIsError
  } = useQuery<LibraryObjectsSearchQueryResp>({
    queryKey: ['libraryObjectsSearchQuery', searchArgs], // how to manager the cache key
    queryFn: () => {
      // translate the UI filter state to 'flat' search arguments that can be used to call the query
      return libraryObjectsSearchQuery(searchArgs)
    }
    // select: (res: Response) => res.entry.map((entry) => entry.resource) // picks only resource array from entry that was in response
  })

  // there is probably a better way to do this, but i think it's fine for now until everything else has settled \
  // this lib filter patterm might not stay here for long
  const options = useMemo(() => {
    const { disciplines } = COURSEFLOW_APP.globalContextData
    console.log(COURSEFLOW_APP.globalContextData)
    return {
      ...defaultOptionsSearchOptions,
      filterGroups: {
        ...defaultOptionsSearchOptions.filterGroups,
        disciplineOptions: disciplines.map((item) => {
          return {
            name: `discipline_option_${item.id}`,
            label: _t(item.title),
            value: item.id
          }
        })
      }
    }
  }, [])

  /*******************************************************
   * RENDER
   *******************************************************/
  if (libIsLoading) return <Loader />
  if (libIsError) {
    return <div>An error occurred: {libError.message} </div>
  }

  return (
    <LibrarySearchView
      data={libData}
      defaultOptionsSearchOptions={options}
      setSearchArgs={setSearchArgs}
      isLoading={libIsLoading}
      isError={libIsError}
    />
  )
}

export default ExplorePage
