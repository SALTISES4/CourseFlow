import { LibraryContentTypeIn, LibrarySearchIn } from '@cf/api/gen'
import { _t } from '@cf/utility/Utility.class'
import FilterMultiselect from '@cfComponents/filters/FilterMultiselect'
import { SearchFilterOption } from '@cfComponents/filters/types'
import LibraryHelper, {
  SearchOptions
} from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { produce } from 'immer'
import { Dispatch, SetStateAction, useCallback } from 'react'

const WorkflowTypeFilter = ({
  show,
  setSearchFilterState,
  searchArgs,
  filterGroup
}: {
  show: boolean
  setSearchFilterState: Dispatch<SetStateAction<SearchOptions>>
  searchArgs: LibrarySearchIn
  filterGroup: SearchOptions['filterGroups']['workflowTypeFilter']
}) => {
  const contentType = searchArgs.filters?.contentType
  const forceVisible =
    contentType === LibraryContentTypeIn.WORKFLOW || !contentType
  const { options } = filterGroup

  const onChange = useCallback(
    (values: SearchFilterOption[]) => {
      setSearchFilterState(
        produce((draft) => {
          const current = draft.filterGroups.workflowTypeFilter.options

          draft.filterGroups.workflowTypeFilter.options =
            LibraryHelper.updateFilterOptions(current, values)
          draft.pagination.page = 0
        })
      )
    },
    [setSearchFilterState]
  )

  if (!show || !forceVisible) {
    return null
  }

  return (
    <FilterMultiselect
      placeholder={filterGroup.label}
      options={options}
      showSearch={false}
      onChange={onChange}
    />
  )
}

export default WorkflowTypeFilter
