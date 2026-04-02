import { LibrarySearchIn } from '@cf/api/gen'
import LibrarySearchView from '@cfViews/LibrarySearchView'
import LibraryHelper from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { useState } from 'react'

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

  const config = {
    pagination: true,
    sortOptions: true,
    filterGroups: {
      relationshipFilter: false,
      disciplineFilter: true,
      workspaceTypeFilter: true,
      templateFilter: true
    },
    keywordFilter: true
  }

  const locked = [{ name: 'isPublished', value: true }]

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
