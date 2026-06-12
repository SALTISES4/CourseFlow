import { LibrarySearchIn } from '@cf/api/gen'
import LibrarySearchView, {
  LibraryFilterConfig
} from '@cfViews/LibrarySearchView'
import LibraryHelper from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { useCallback, useState } from 'react'

type PropsType = {
  uuid: string
}

const TabWorkflows = ({ uuid }: PropsType) => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const config: LibraryFilterConfig = {
    filterGroups: {
      disciplineFilter: true,
      contentTypeFilter: true,
      templateFilter: true
    }
  }

  const [searchArgs, setSearchArgs] = useState<LibrarySearchIn>({})

  const updateSearchArgsHandler = useCallback(
    (args: LibrarySearchIn) => {
      setSearchArgs(
        LibraryHelper.applyLockedFilters(args, { projectUuid: uuid })
      )
    },
    [uuid]
  )

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

export default TabWorkflows
