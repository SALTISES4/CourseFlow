import { WorkspaceType } from '@cf/types/enum'
import LibrarySearchView from '@cfViews/LibrarySearchView'
import LibraryHelper from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { LibraryObjectsSearchQueryArgs } from '@XMLHTTP/types/args'
import { useState } from 'react'

type PropsType = {
  selected?: string
  onProjectSelect: (id: string) => void
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
      workspaceTypeFilter: false,
      templateFilter: false
    },
    keywordFilter: true
  }

  const locked = [{ name: 'workspaceType', value: WorkspaceType.PROJECT }]

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
      override={{
        onCardSelect: onProjectSelect,
        selectedid: selected
      }}
    />
  )
}

export default ProjectSearch
