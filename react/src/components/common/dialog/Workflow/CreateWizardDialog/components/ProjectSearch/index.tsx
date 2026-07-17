import { LibraryContentTypeIn, LibrarySearchIn } from '@cf/api/gen'
import LibrarySearchView, {
  LibraryFilterConfig
} from '@cfViews/LibrarySearchView'
import LibraryHelper from '@cfViews/LibrarySearchView/LibraryHelper.Class'
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
    sortOptions: false
  }

  const [searchArgs, setSearchArgs] = useState<LibrarySearchIn>({})

  const updateSearchArgsHandler = useCallback((args: LibrarySearchIn) => {
    setSearchArgs(
      LibraryHelper.applyLockedFilters(args, {
        contentType: LibraryContentTypeIn.PROJECT
      })
    )
  }, [])

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
        uuid: selected ?? ''
      }}
    />
  )
}

export default ProjectSearch
