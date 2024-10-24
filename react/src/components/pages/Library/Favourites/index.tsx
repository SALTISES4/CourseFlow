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
  // this are the formatted search args, reduced to only active filters, and formatted in a flat list for the API call
  // update to UI state, triggers an update to the search Args state, which in turn triggers useQuery
  // there is room for optimization / refactoring but do not recombine these states: UI filters are arbitrarily broken up and a presented in different ways
  // this grouping should not leak into the final API arguments calls

  const [searchArgs, setSearchArgs] = useState<LibraryObjectsSearchQueryArgs>(
    {}
  )
  // @todo we're probably sending two requests with this setup now that child defines state
  // solve with an 'init' state ?

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
