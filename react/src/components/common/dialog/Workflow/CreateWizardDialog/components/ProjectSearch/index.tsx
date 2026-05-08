import LibrarySearchView from '@cfViews/LibrarySearchView'
import LibraryHelper from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { TypedLibrarySearchArgs } from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { useState } from 'react'

type PropsType = {
  selected?: string
  onProjectSelect: (uuid: string) => void
}

const ProjectSearch = ({ selected, onProjectSelect }: PropsType) => {
  /*******************************************************
   * HOOKS
   *******************************************************/

  const config = {
    pagination: true,
    sortOptions: false,
    filterGroups: {
      relationshipFilter: false,
      disciplineFilter: false,
      contentTypeFilter: false,
      templateFilter: false
    },
    keywordFilter: true
  }

  const locked = { contentType: 'project' as const }

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
      override={{
        onCardSelect: onProjectSelect,
        uuid: selected
      }}
    />
  )
}

export default ProjectSearch
