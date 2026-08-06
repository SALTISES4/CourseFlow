import { LibraryContentTypeIn } from '@cf/api/gen'
import LibrarySearchView, {
  LibraryFilterConfig
} from '@cfViews/LibrarySearchView'

const FavoritesPage = () => {
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

  return (
    <LibrarySearchView
      config={config}
      lockedFilters={{
        isFavorite: true,
        includePublishedFavorites: true
      }}
    />
  )
}

export default FavoritesPage
