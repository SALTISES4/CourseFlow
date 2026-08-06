import { LibraryContentTypeIn } from '@cf/api/gen'
import LibrarySearchView, {
  LibraryFilterConfig
} from '@cfViews/LibrarySearchView'

type PropsType = {
  uuid: string
}

const TabWorkflows = ({ uuid }: PropsType) => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const config: LibraryFilterConfig = {
    initialContentType: LibraryContentTypeIn.WORKFLOW,
    filterGroups: {
      ownershipFilter: true,
      workflowTypeFilter: true,
      keywordFilter: true,
      favoritesFilter: true,
      archiveFilter: true
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <div data-test-id="project-workflows-view">
      <LibrarySearchView
        config={config}
        lockedFilters={{ projectUuid: uuid }}
      />
    </div>
  )
}

export default TabWorkflows
