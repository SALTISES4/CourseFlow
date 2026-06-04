import LibrarySearchView from '@cfViews/LibrarySearchView'
import { TypedLibrarySearchArgs } from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { useState } from 'react'

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

  const [searchArgs, setSearchArgs] = useState<TypedLibrarySearchArgs>({})

  const updateSearchArgsHandler = (args: TypedLibrarySearchArgs) => {
    setSearchArgs(args)
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
