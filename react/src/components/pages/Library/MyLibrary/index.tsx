import { LibrarySearchIn } from '@cf/api/gen'
import LibrarySearchView, {
  LibraryFilterConfig
} from '@cfViews/LibrarySearchView'
import { useCallback, useState } from 'react'

/*******************************************************
 * @LibraryRenderer
 *******************************************************/
const LibraryPage = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const config: LibraryFilterConfig = {
    filterGroups: {
      ownershipFilter: true,
      contentTypeFilter: true,
      workflowTypeFilter: true,
      keywordFilter: true,
      favoritesFilter: true,
      archiveFilter: true
    }
  }

  const [searchArgs, setSearchArgs] = useState<LibrarySearchIn>({})

  const updateSearchArgsHandler = useCallback((args: LibrarySearchIn) => {
    setSearchArgs(args)
  }, [])

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

export default LibraryPage
