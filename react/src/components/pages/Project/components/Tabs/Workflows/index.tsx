import LibrarySearchView from '@cfViews/LibrarySearchView'
import LibraryHelper from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { TypedLibrarySearchArgs } from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { useState } from 'react'

type PropsType = {
  uuid: string
}

const TabWorkflows = ({ uuid }: PropsType) => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const config = {
    pagination: true,
    sortOptions: true,
    filterGroups: {
      relationshipFilter: false,
      disciplineFilter: true,
      contentTypeFilter: true,
      templateFilter: true
    },
    keywordFilter: true
  }

  const locked = { projectUuid: uuid }

  const [searchArgs, setSearchArgs] = useState<TypedLibrarySearchArgs>({})

  const updateSearchArgsHandler = (args: TypedLibrarySearchArgs) => {
    setSearchArgs(LibraryHelper.applyLockedFilters(args, locked))
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
