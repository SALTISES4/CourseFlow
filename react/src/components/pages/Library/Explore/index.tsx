import { _t } from '@cf/utility/utilityFunctions'
import Loader from '@cfComponents/UIPrimitives/Loader'
import LibrarySearchView from '@cfViews/LibrarySearchView'
import LibraryHelper from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { getErrorMessage } from '@XMLHTTP/API/api'
import { useLibraryObjectsSearchQuery } from '@XMLHTTP/API/library.rtk'
import { LibraryObjectsSearchQueryArgs } from '@XMLHTTP/types/args'
import { produce } from 'immer'
import * as React from 'react'
import { useMemo, useState } from 'react'

/*
 * @todo
 *   1 -- the filters are not connected properly to the backend query
 *   2 -- the library seach view needs to be more flexible / dynamic for filter type config
 *      see: https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow---V2?node-id=1181-17902&node-type=FRAME&t=rIPGYwZ2k9mYfbzx-0
 *      we need to add some data in our defaultOptionsSearchOptions config about filter/sort types
 *     - search/ keywrod input
 *           select list with inplace, within list filtering (i.e. disciplies) that have multiple allowable options at once
 *     - binary on off button filter (template)
 *     - simple list filter (type)
 *     - sort (relevance)
 * */

const ExplorePage = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/

  const [searchArgs, setSearchArgs] = useState<LibraryObjectsSearchQueryArgs>(
    {}
  )

  /*******************************************************
   * QUERIES
   *******************************************************/
  const {
    data: libData,
    error: libError,
    isLoading: libIsLoading,
    isError: libIsError,
    isFetching
  } = useLibraryObjectsSearchQuery(searchArgs)

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <LibrarySearchView
      data={libData}
      defaultOptionsSearchOptions={LibraryHelper.defaultOptionsSearchOptions}
      setSearchArgs={setSearchArgs}
      isLoading={libIsLoading || isFetching}
      isError={libIsError}
    />
  )
}

export default ExplorePage

/*******************************************************
 * ATCHIVE
 * disciplines are being added inside the view now
 *******************************************************/
// there is probably a better way to do this, but i think it's fine for now until everything else has settled \
// this lib filter patterm might not stay here for long
// const options = useMemo(() => {
//   const { disciplines } = COURSEFLOW_APP.globalContextData
//   return produce(LibraryHelper.defaultOptionsSearchOptions, (draft) => {
//     draft.filterGroups = {
//       ...draft.filterGroups,
//       disciplineFilter: {
//         ...draft.filterGroups.disciplineFilter,
//         options: disciplines.map((item) => ({
//           name: `discipline_option_${item.id}`,
//           label: _t(item.title),
//           value: item.id
//         }))
//       }
//     }
//   })
// }, [])
