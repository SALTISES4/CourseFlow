import { _t } from '@cf/utility/utilityFunctions'
import LibrarySearchView, {
  SearchOptionsState
} from '@cfViews/LibrarySearchView'
import { useLibraryObjectsSearchQuery } from '@XMLHTTP/API/library.rtk'
import { LibraryObjectsSearchQueryArgs } from '@XMLHTTP/types/args'
import { useState } from 'react'
import * as React from 'react'

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
        name: 'favourites',
        label: _t('Favourites'),
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
    useLibraryObjectsSearchQuery(searchArgs)

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
