import { useLibrarySearch } from '@cf/api/wrappedHooks'
import useNavigateToLibraryItem from '@cf/hooks/useNavigateToLibraryItem'
import { formatLibraryObjects } from '@cf/utility/marshalling/libraryCards'
import FilterWorkflows from '@cfComponents/filters/FilterWorkflows'
import { SearchOptions } from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { produce } from 'immer'
import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'

/*******************************************************
 * Input field
 * this one has been extracted from the main component becuase it has its own lifecycle and query
 * this separate query is a bad idea.
 * although passing in the state setter / getter from the parent probably undermines this
 *
 * It's an attempt to mimic
 * 'instant search' style UI (like Algolia)
 * but we don't really have that infrastructure in place
 *******************************************************/
const Search = ({
  setSearchFilterState
}: {
  setSearchFilterState: Dispatch<SetStateAction<SearchOptions>>
}) => {
  const { t } = useTranslation('library')
  const navigateToItem = useNavigateToLibraryItem()
  const { data, isError } = useLibrarySearch({})

  if (isError) {
    return <div>{t('results.searchFailed')}</div>
  }

  const res = data?.items || []
  const cards = formatLibraryObjects(res, t)

  return (
    <FilterWorkflows
      workflows={cards}
      // handle key down (enter) which will pass the 'keyword' filter string over to the external search
      onPropagateChange={(val) => {
        setSearchFilterState(
          produce((draft) => {
            draft.filterGroups.keywordFilter.value = val
            draft.pagination.page = 0
          })
        )
      }}
      onChange={(workflow) => {
        const match = cards.find((card) => workflow.uuid === card.uuid)
        if (!match) {
          return
        }
        navigateToItem(match.uuid, match.type)
      }}
    />
  )
}

export default Search
