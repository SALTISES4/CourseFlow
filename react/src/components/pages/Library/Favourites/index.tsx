import { LibrarySearchIn } from '@cf/api/gen'
import LibraryHelper from '@cfViews/LibrarySearchView/LibraryHelper.Class'
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
      relationshipFilter: false,
      templateFilter: true
    },
    keywordFilter: true
  }

  const locked = [{ name: 'type', value: 'favourited' }]

  const [searchArgs, setSearchArgs] = useState<LibrarySearchIn>({})

  const updateSearchArgsHandler = (args: LibrarySearchIn) => {
    const merged = LibraryHelper.merger(locked, args.filters)

    setSearchArgs({
      ...args,
      filters: merged
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
