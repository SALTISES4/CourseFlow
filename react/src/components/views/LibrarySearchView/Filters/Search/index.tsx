import FilterWorkflows from '@cfComponents/filters/FilterWorkflows'
import { SearchOptions } from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { produce } from 'immer'
import { Dispatch, SetStateAction } from 'react'

const Search = ({
  setSearchFilterState
}: {
  setSearchFilterState: Dispatch<SetStateAction<SearchOptions>>
}) => {
  return (
    <FilterWorkflows
      onPropagateChange={(val) => {
        setSearchFilterState(
          produce((draft) => {
            draft.filterGroups.keywordFilter.value = val
            draft.pagination.page = 0
          })
        )
      }}
    />
  )
}

export default Search
