import { _t } from '@cf/utility/Utility.class'
import FilterButton from '@cfComponents/filters/FilterButton'
import LibraryHelper, {
  SearchOptions
} from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import CategoryIcon from '@mui/icons-material/Category'
import { produce } from 'immer'
import { Dispatch, SetStateAction } from 'react'

const ContentType = ({
  show,
  filterGroup,
  setSearchFilterState
}: {
  show: boolean
  filterGroup: SearchOptions['filterGroups']['contentTypeFilter']
  setSearchFilterState: Dispatch<SetStateAction<SearchOptions>>
}) => {
  if (!show) {
    return <></>
  }

  const { options } = filterGroup

  return (
    <FilterButton
      placeholder={filterGroup.label}
      options={options}
      icon={<CategoryIcon />}
      onChange={(value) => {
        setSearchFilterState(
          produce((draft) => {
            const current = draft.filterGroups.contentTypeFilter.options

            draft.filterGroups.contentTypeFilter.options =
              LibraryHelper.updateFilterOptions(current, value)
            draft.pagination.page = 0
          })
        )
      }}
    />
  )
}

export default ContentType
