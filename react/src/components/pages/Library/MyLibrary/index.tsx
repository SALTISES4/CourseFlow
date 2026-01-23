import { LibraryObjectsSearchQueryArgs } from '@XMLHTTP/types/args'
import { useState } from 'react'

import LibrarySearchView from 'components/views/LibrarySearchView'

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
      relationshipFilter: true,
      templateFilter: true
    },
    keywordFilter: true
  }

  const locked = []

  const [searchArgs, setSearchArgs] = useState<LibraryObjectsSearchQueryArgs>(
    {}
  )

  const updateSearchArgsHandler = (args: LibraryObjectsSearchQueryArgs) => {
    const newFilters = args.filters.map((item) => {
      for (const lockItem of locked) {
        if (lockItem.name == item.name) {
          return lockItem
        }
      }
      return item
    })

    setSearchArgs({
      ...args,
      filters: newFilters
    })
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
