import { LibraryContentTypeIn } from '@cf/api/gen'
import LibrarySearchView, {
  LibraryFilterConfig
} from '@cfViews/LibrarySearchView'
import LibraryHelper from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { TypedLibrarySearchArgs } from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { useCallback, useState } from 'react'

type PropsType = {
  selected?: string
  onProjectSelect: (uuid: string) => void
}

const ProjectSearch = ({ selected, onProjectSelect }: PropsType) => {
  /*******************************************************
   * HOOKS
   *******************************************************/

  const config: LibraryFilterConfig = {
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

  const [searchArgs, setSearchArgs] = useState<TypedLibrarySearchArgs>({})

  const updateSearchArgsHandler = useCallback(
    (args: TypedLibrarySearchArgs) => {
      setSearchArgs(
        LibraryHelper.applyLockedFilters(args, {
          contentType: LibraryContentTypeIn.PROJECT
        })
      )
    },
    []
  )

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
