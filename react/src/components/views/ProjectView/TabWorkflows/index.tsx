import LibrarySearchView from '@cfViews/LibrarySearchView'
import LibraryHelper from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { LibraryObjectsSearchQueryArgs } from '@XMLHTTP/types/args'
import * as React from 'react'
import { useState } from 'react'

type PropsType = {
  projectId: number
}

const TabWorkflows = ({ projectId }: PropsType) => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const config = {
    pagination: true,
    sortOptions: true,
    filterGroups: {
      relationshipFilter: false,
      disciplineFilter: true,
      workspaceTypeFilter: true,
      templateFilter: true
    },
    keywordFilter: true
  }

  const locked = [{ name: 'project', value: projectId }]

  const [searchArgs, setSearchArgs] = useState<LibraryObjectsSearchQueryArgs>(
    {}
  )

  const updateSearchArgsHandler = (args: LibraryObjectsSearchQueryArgs) => {
    const merged = LibraryHelper.merger(locked, args.filters)

    setSearchArgs({
      ...args,
      filters: merged
    })
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <LibrarySearchView
      config={config}
      searchArgs={searchArgs}
      setSearchArgs={updateSearchArgsHandler}
    />
  )
}

export default TabWorkflows
