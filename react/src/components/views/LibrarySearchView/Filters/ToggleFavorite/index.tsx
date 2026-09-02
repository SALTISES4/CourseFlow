import FilterToggle from '@cfComponents/filters/FilterToggle'
import { SearchOptions } from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import StarIcon from '@mui/icons-material/Star'
import { produce } from 'immer'
import { Dispatch, SetStateAction } from 'react'

const ToggleFavorite = ({
  show,
  filterGroup,
  setSearchFilterState
}: {
  show: boolean
  filterGroup: SearchOptions['filterGroups']['favoritesFilter']
  setSearchFilterState: Dispatch<SetStateAction<SearchOptions>>
}) => {
  if (!show) {
    return <></>
  }

  return (
    <FilterToggle
      label={filterGroup.label}
      icon={<StarIcon />}
      className="filter-favorite"
      checked={!!filterGroup.value}
      onChange={(checked) =>
        setSearchFilterState(
          produce((draft) => {
            draft.filterGroups.favoritesFilter.value = !!checked || undefined
            draft.pagination.page = 0
          })
        )
      }
    />
  )
}

export default ToggleFavorite
