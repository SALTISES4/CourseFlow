import { _t } from '@cf/utility/Utility.class'
import FilterToggle from '@cfComponents/filters/FilterToggle'
import { SearchOptions } from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined'
import { produce } from 'immer'
import { Dispatch, SetStateAction } from 'react'

const ToggleTemplate = ({
  show,
  filterGroup,
  setSearchFilterState
}: {
  show: boolean
  filterGroup: SearchOptions['filterGroups']['templateFilter']
  setSearchFilterState: Dispatch<SetStateAction<SearchOptions>>
}) => {
  if (!show) {
    return <></>
  }

  return (
    <FilterToggle
      label={filterGroup.label}
      icon={<SpaceDashboardOutlinedIcon />}
      color="template"
      checked={!!filterGroup.value}
      onChange={(checked) =>
        setSearchFilterState(
          produce((draft) => {
            draft.filterGroups.templateFilter.value = !!checked || undefined
            draft.pagination.page = 0
          })
        )
      }
    />
  )
}

export default ToggleTemplate
