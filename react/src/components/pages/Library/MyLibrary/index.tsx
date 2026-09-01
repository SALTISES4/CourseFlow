import { LibraryContentTypeIn } from '@cf/api/gen'
import LibrarySearchView, {
  LibraryFilterConfig
} from '@cfViews/LibrarySearchView'

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
      favoritesFilter: true,
      archiveFilter: true
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  return <LibrarySearchView config={config} />
}

export default LibraryPage
