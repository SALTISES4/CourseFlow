import { LibraryContentTypeIn, LibrarySearchIn } from '@cf/api/gen'
import LibrarySearchView, {
  LibraryFilterConfig
} from '@cfViews/LibrarySearchView'
import LibraryHelper from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { useCallback, useState } from 'react'

/*******************************************************
 * @LibraryRenderer
 *******************************************************/
const LibraryPage = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const config: LibraryFilterConfig = {
    initialContentType: LibraryContentTypeIn.PROJECT,
    filterGroups: {
      ownershipFilter: true,
      contentTypeFilter: true,
      workflowTypeFilter: true,
      keywordFilter: true,
      templateFilter: true
    }
  }

  const [searchArgs, setSearchArgs] = useState<LibrarySearchIn>({})

  const updateSearchArgsHandler = useCallback((args: LibrarySearchIn) => {
    setSearchArgs(
      LibraryHelper.applyLockedFilters(args, {
        isFavorite: true,
        includePublishedFavorites: true
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
    />
  )
}

export default LibraryPage
