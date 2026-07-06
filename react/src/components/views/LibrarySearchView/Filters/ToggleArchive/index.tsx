import { _t } from '@cf/utility/Utility.class'
import FilterToggle from '@cfComponents/filters/FilterToggle'
import { SearchOptions } from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import { produce } from 'immer'
import { Dispatch, SetStateAction } from 'react'

const ToggleArchive = ({
  show,
  filterGroup,
  setSearchFilterState
}: {
  show: boolean
  filterGroup: SearchOptions['filterGroups']['archiveFilter']
  setSearchFilterState: Dispatch<SetStateAction<SearchOptions>>
}) => {
  if (!show) {
    return <></>
  }

  return (
    <FilterToggle
      label={filterGroup.label}
      icon={<ArchiveOutlinedIcon />}
      onChange={(checked) =>
        setSearchFilterState(
          produce((draft) => {
            draft.filterGroups.archiveFilter.value = !!checked || undefined
            draft.pagination.page = 0
          })
        )
      }
    />
  )
}

export default ToggleArchive
