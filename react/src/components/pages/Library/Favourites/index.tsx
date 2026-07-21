import { LibrarySearchIn } from '@cf/api/gen'
import LibrarySearchView, {
  LibraryFilterConfig
} from '@cfViews/LibrarySearchView'
import LibraryHelper from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { useCallback, useState } from 'react'

const FavoritesPage = () => {
  const config: LibraryFilterConfig = {
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

  return (
    <LibrarySearchView
      config={config}
      searchArgs={searchArgs}
      setSearchArgs={updateSearchArgsHandler}
    />
  )
}

export default FavoritesPage
