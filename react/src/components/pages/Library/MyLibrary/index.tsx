import { _t } from '@cf/utility/utilityFunctions'
import LibraryHelper from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { useLibraryObjectsSearchQuery } from '@XMLHTTP/API/library.rtk'
import { LibraryObjectsSearchQueryArgs } from '@XMLHTTP/types/args'
import { useState } from 'react'
import * as React from 'react'

import LibrarySearchView from 'components/views/LibrarySearchView'

/*******************************************************
 * @LibraryRenderer
 *******************************************************/
const LibraryPage = () => {
  const [searchArgs, setSearchArgs] = useState<LibraryObjectsSearchQueryArgs>(
    {}
  )
  const { data, error, isLoading, isError } =
    useLibraryObjectsSearchQuery(searchArgs)

  return (
    <LibrarySearchView
      data={data}
      defaultOptionsSearchOptions={LibraryHelper.defaultOptionsSearchOptions}
      setSearchArgs={setSearchArgs}
      isLoading={isLoading}
      isError={isError}
    />
  )
}

export default LibraryPage
