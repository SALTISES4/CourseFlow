import { LibraryFiltersIn, LibrarySearchIn } from '@cf/api/gen'
import LibraryHelper from '@cf/components/views/LibrarySearchView/LibraryHelper.Class'
import LibrarySearchView, {
  LibraryFilterConfig
} from '@cfViews/LibrarySearchView'
import { useCallback, useState } from 'react'
import { useLocation } from 'react-router-dom'

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

// set isTemplate filter true when navigating over from the
// Homepage -> Templates section -> See All link
// handled through location state (no query params, separate route, etc)
export const exploreTemplateFilters: Partial<LibraryFiltersIn> = {
  isTemplate: true
}

const ExplorePage = () => {
  const location = useLocation()
  const isTemplateFilter = location.state?.isTemplate ?? null

  /*******************************************************
   * HOOKS
   *******************************************************/
  const config: LibraryFilterConfig = {
    errorMessage:
      'We encountered an issue and were not able to load the content.',
    filterGroups: {
      disciplineFilter: true,
      contentTypeFilter: true,
      workflowTypeFilter: true,
      keywordFilter: true,
      templateFilter: true,
      favoritesFilter: true
    }
  }

  const [searchArgs, setSearchArgs] = useState<LibrarySearchIn>({})

  const updateSearchArgsHandler = useCallback(
    (args: LibrarySearchIn) => {
      console.log('locking isTemplateFilter?', isTemplateFilter)
      setSearchArgs(
        LibraryHelper.applyLockedFilters(args, {
          isTemplate: isTemplateFilter
        })
      )
    },
    [isTemplateFilter]
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
//           name: `discipline_option_${item.uuid}`,
//           label: _t(item.title),
//           value: item.uuid
//         }))
//       }
//     }
//   })
// }, [])
