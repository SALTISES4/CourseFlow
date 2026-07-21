import { _t } from '@cf/utility/Utility.class'
import FilterButton from '@cfComponents/filters/FilterButton'
import LibraryHelper, {
  SearchOptions
} from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import FilterIcon from '@mui/icons-material/FilterAlt'
import { produce } from 'immer'
import { Dispatch, SetStateAction } from 'react'

const Ownership = ({
  show,
  filterGroup,
  setSearchFilterState
}: {
  show: boolean
  filterGroup: SearchOptions['filterGroups']['ownershipFilter']
  setSearchFilterState: Dispatch<SetStateAction<SearchOptions>>
}) => {
  if (!show) {
    return <></>
  }

  const { options } = filterGroup

  return (
    <FilterButton
      placeholder={filterGroup.label}
      options={options ?? []}
      icon={<FilterIcon />}
      onChange={(value) => {
        setSearchFilterState(
          produce((draft) => {
            const current = draft.filterGroups.ownershipFilter.options ?? []

            draft.filterGroups.ownershipFilter.options =
              LibraryHelper.updateFilterOptions(current, value)
            draft.pagination.page = 0
          })
        )
      }}
    />
  )
}

export default Ownership
