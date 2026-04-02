import { LibrarySearchIn } from '@cf/api/gen'
import LibrarySearchView from '@cfViews/LibrarySearchView'
import LibraryHelper from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { useState } from 'react'

type PropsType = {
  projectUuid: string
}

const TabWorkflows = ({ projectUuid }: PropsType) => {
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

  const locked = [{ name: 'project', value: projectUuid }]

  const [searchArgs, setSearchArgs] = useState<LibrarySearchIn>({})

  const updateSearchArgsHandler = (args: LibrarySearchIn) => {
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
