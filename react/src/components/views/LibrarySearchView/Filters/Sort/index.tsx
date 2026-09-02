import SortableFilterButton from '@cfComponents/filters/SortableFilterButton'
import { SortOption } from '@cfComponents/filters/types'
import LibraryHelper, {
  SearchOptions
} from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import SortIcon from '@mui/icons-material/Sort'
import { produce } from 'immer'
import { Dispatch, SetStateAction } from 'react'

/**
 * This is a thin wrapper around SortableFilterButton, it's just used to clean up the main return statement
 * this is why it's a plain function returning JSX
 * searchParameters.sortOptions.options is passed in and sets initial state
 * but after that, SortableFilterButton manages its own state internally
 *
 **/

const Sort = ({
  show,
  options,
  setSearchFilterState
}: {
  show: boolean
  options: SortOption[]
  setSearchFilterState: Dispatch<SetStateAction<SearchOptions>>
}) => {
  if (!show) {
    return <></>
  }

  return (
    <SortableFilterButton
      options={options}
      icon={<SortIcon />}
      onChange={(value, direction) => {
        setSearchFilterState(
          produce((draft) => {
            const current = draft.sortOptions.options

            draft.sortOptions.options = LibraryHelper.updateSortOptions(
              current,
              { value, direction }
            )
            draft.pagination.page = 0
          })
        )
      }}
      onReset={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setSearchFilterState(
          produce((draft) => {
            draft.sortOptions.options.forEach((option) => {
              option.enabled = false
              option.direction = undefined
            })
            draft.pagination.page = 0
          })
        )
      }}
    />
  )
}

export default Sort
