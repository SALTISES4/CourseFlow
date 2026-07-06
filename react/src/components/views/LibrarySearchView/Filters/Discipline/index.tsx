import { _t } from '@cf/utility/Utility.class'
import FilterMultiselect, {
  FilterMultiselectOption
} from '@cfComponents/filters/FilterMultiselect'
import { SearchFilterOption } from '@cfComponents/filters/types'
import LibraryHelper, {
  SearchOptions
} from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import { produce } from 'immer'
import { Dispatch, SetStateAction, useCallback } from 'react'

const DisciplineFilter = ({
  show,
  options,
  setSearchFilterState
}: {
  show: boolean
  options: FilterMultiselectOption[]
  setSearchFilterState: Dispatch<SetStateAction<SearchOptions>>
}) => {
  const onChange = useCallback(
    (values: SearchFilterOption[]) => {
      setSearchFilterState(
        produce((draft) => {
          const newState = LibraryHelper.updateFilterOptions(options, values)
          draft.filterGroups.disciplineFilter.options = newState
          draft.pagination.page = 0
        })
      )
    },
    [options, setSearchFilterState]
  )

  if (!show) {
    return null
  }

  return (
    <FilterMultiselect
      placeholder={_t('Discipline')}
      searchPlaceholder={_t('Find discipline')}
      options={options}
      onChange={onChange}
    />
  )
}

export default DisciplineFilter
