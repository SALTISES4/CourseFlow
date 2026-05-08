import LibraryHelper from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { useState } from 'react'

import LibrarySearchView from 'components/views/LibrarySearchView'
import { TypedLibrarySearchArgs } from 'components/views/LibrarySearchView/LibraryHelper.Class'

/*******************************************************
 * @LibraryRenderer
 *******************************************************/
const LibraryPage = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/

  const config = {
    pagination: true,
    sortOptions: true,
    filterGroups: {
      relationshipFilter: false,
      templateFilter: true
    },
    keywordFilter: true
  }

  const locked = { isFavorite: true }

  const [searchArgs, setSearchArgs] = useState<TypedLibrarySearchArgs>({})

  const updateSearchArgsHandler = (args: TypedLibrarySearchArgs) => {
    setSearchArgs(LibraryHelper.applyLockedFilters(args, locked))
  }

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
