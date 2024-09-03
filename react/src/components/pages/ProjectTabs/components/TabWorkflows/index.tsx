import * as React from 'react'
import { _t } from '@cf/utility/utilityFunctions'
import { useQuery } from '@tanstack/react-query'
import { LibraryObjectsSearchQueryResp } from '@XMLHTTP/types/query'
import { libraryObjectsSearchQuery } from '@XMLHTTP/API/library'
import { useState } from 'react'
import { LibraryObjectsSearchQueryArgs } from '@XMLHTTP/types/args'
import LibrarySearchView, {
  SearchOptionsState
} from 'components/views/LibrarySearchView'

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
    ]
  }
}

type PropsType = {
  projectId: number
}
/*******************************************************
 * @LibraryRenderer
 *******************************************************/
const TabWorkflows = ({ projectId }: PropsType) => {
  // @this query needs to get the workflows by project ID
  const [searchArgs, setSearchArgs] = useState<LibraryObjectsSearchQueryArgs>(
    {}
  )
  const { data, error, isLoading, isError } =
    useQuery<LibraryObjectsSearchQueryResp>({
      queryKey: ['libraryObjectsSearchQuery', searchArgs], // how to manager the cache key
      queryFn: () => {
        // translate the UI filter state to 'flat' search arguments that can be used to call the query
        return libraryObjectsSearchQuery(searchArgs)
      }
      // select: (res: Response) => res.entry.map((entry) => entry.resource) // picks only resource array from entry that was in response
    })

  return (
    <LibrarySearchView
      data={data}
      defaultOptionsSearchOptions={defaultOptionsSearchOptions}
      setSearchArgs={setSearchArgs}
      isLoading={isLoading}
      isError={isError}
    />
  )
}

export default TabWorkflows
