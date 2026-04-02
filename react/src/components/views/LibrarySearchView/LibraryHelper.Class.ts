import {
  LibraryFilterIn,
  LibrarySearchIn,
  LibrarySortDirectionIn,
  LibrarySortValueIn
} from '@cf/api/gen'
import { WorkspaceType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
// import {
//   SortDirection,
//   SortValueOption
// } from '@cfComponents/filters/SortableFilterButton'
import {
  SearchFilterGroup,
  SearchFilterOption,
  SortOption
} from '@cfComponents/filters/types'
import { WorkflowType } from '@cfPages/Workspace/Workflow/types'
type FilterGroups = { [key: string]: SearchFilterGroup }

type Option = any

export type SearchOptions = {
  pagination: {
    page: number
  }
  sortOptions: {
    options: SortOption[]
  }
  filterGroups: {
    relationshipFilter: SearchFilterGroup
    disciplineFilter: SearchFilterGroup
    workspaceTypeFilter: SearchFilterGroup
    keywordFilter: SearchFilterGroup
    templateFilter: SearchFilterGroup
  }
}

/**
 *
 **/
class LibraryHelper {
  static defaultOptionsSearchOptions: SearchOptions = {
    pagination: {
      page: 0
    },
    sortOptions: {
      options: [
        {
          value: LibrarySortValueIn.DATE_MODIFIED,
          label: 'Recent'
        },
        {
          value: LibrarySortValueIn.A_Z,
          label: 'A - Z'
        },
        {
          value: LibrarySortValueIn.DATE_CREATED,
          label: 'Creation date'
        }
      ]
    },
    filterGroups: {
      // Filter group with dynamically populated options
      relationshipFilter: {
        name: 'type',
        label: 'Type',
        options: [
          {
            value: null,
            label: _t('All'),
            enabled: true
          },
          {
            value: 'owned',
            label: _t('Owned')
          },
          {
            value: 'shared',
            label: _t('Shared')
          },
          {
            value: 'favourited',
            label: _t('Favourites')
          },
          {
            value: 'archived',
            label: _t('Archived')
          }
        ]
      },
      // Filter group with dynamically populated options
      disciplineFilter: {
        name: 'discipline',
        label: _t('Discipline'),
        selectMultiple: true,
        options: []
      },
      // Filter group with a single selectable options at one time
      workspaceTypeFilter: {
        name: 'workspaceType',
        label: _t('Type'),
        options: [
          {
            label: 'All',
            value: null,
            enabled: true
          },
          {
            label: 'Project',
            value: WorkspaceType.PROJECT
          },
          {
            label: 'Program',
            value: WorkflowType.PROGRAM
          },

          {
            label: 'Course',
            value: WorkflowType.COURSE
          },
          {
            label: 'Activity',
            value: WorkflowType.ACTIVITY
          }
        ]
      },
      // Filter group with no options or value is binary
      templateFilter: {
        name: 'isTemplate',
        label: _t('template')
      },
      // Filter group with a single value
      keywordFilter: {
        name: 'keyword',
        label: _t('search'),
        value: ''
      }
    }
  }
  /**
   *
   **/
  public static updateFilterOptions(
    options: SearchFilterOption[],
    currentSelection: SearchFilterOption | SearchFilterOption[]
  ): SearchFilterOption[] {
    const isArray = Array.isArray(currentSelection)

    return options.map((option) => {
      // Check if the option is selected based on whether currentSelection is an array or a single value
      const isSelected = isArray
        ? (currentSelection as SearchFilterOption[]).some(
            (selectedOption) => selectedOption.value === option.value
          )
        : option.value === (currentSelection as SearchFilterOption).value

      return {
        ...option,
        enabled: isSelected
      }
    })
  }

  /**
   *
   **/
  public static updateSortOptions(
    options: SortOption[],
    currentSelection: {
      value: LibrarySortValueIn
      direction?: LibrarySortDirectionIn
    }
  ): SortOption[] {
    return options.map((option) => {
      const isSelected = option.value === currentSelection.value

      return {
        ...option,
        enabled: isSelected,
        direction: currentSelection.direction
      }
    })
  }

  /**
   * Main function to process filter groups
   *
   **/
  public static processFilterGroups = (
    filterGroups: FilterGroups
  ): LibraryFilterIn[] => {
    // Helper function to get enabled options for selectMultiple filters
    const getEnabledValues = (options: Option[]): any[] =>
      options.filter((option) => option.enabled).map((option) => option.value)

    // Helper function to get the first enabled option
    const getFirstEnabledValue = (options: Option[]): any | undefined =>
      options.find((option) => option.enabled)?.value

    return Object.values(filterGroups)
      .reduce<LibraryFilterIn[]>((acc, filter) => {
        const { name, options, selectMultiple, value } = filter

        /**
         * We're dealing with a few use cases since we're defining different 'filter options'
         * the if/else shape is messy which suggests there is a better way to do this
         *
         *  Generally this is what we're doing:
         *  create an empty array
         *
         *  iterate through it
         *  if there is an option key
         *  iterate through the options and look for the key value pair enabled is true
         *
         *  if this child has enabled: true
         *  add this to the array as:
         *  name: [ name of item  such as name: workspaceType ]
         *  value: [item value of child above which had enabled true ]
         *
         *  now if the item has option selectMultiple: true,
         *  look for each child that has enabled true
         *
         *  in this case add a new item to the array
         *  name : [ name of item  such as name: discipline ]
         *  value:[ array of all values which had enabled true]
         *
         *
         *  if there is no options just look for the key value (on the parent item)
         *  add this to the  array as
         *  name : [ name of item  such as name: keyword ]
         *  value:[ value of item]
         *
         **/

        if (!options) {
          if (value !== undefined) {
            acc.push({ name, value })
          }
          return acc
        }

        if (selectMultiple) {
          const enabledValues = getEnabledValues(options)
          if (enabledValues.length > 0) {
            acc.push({ name, value: enabledValues })
          }
        } else {
          const enabledValue = getFirstEnabledValue(options)
          if (enabledValue) {
            acc.push({ name, value: enabledValue })
          }
        }

        return acc
      }, [])
      .filter((item) => item.value !== null && item.value !== '')
  }

  /**
   *
   **/
  public static getActiveSortOption = (
    sortOptions: SortOption[]
  ): {
    value: LibrarySortValueIn
    direction: LibrarySortDirectionIn
  } | null => {
    const activeSort = sortOptions.find((option) => option.enabled)
    return activeSort
      ? { value: activeSort.value, direction: activeSort.direction }
      : null
  }

  /**
   * @todo could use more work
   **/
  public static reduceStateToSearchArgs(
    stateParams: SearchOptions
  ): LibrarySearchIn {
    const activeSort = LibraryHelper.getActiveSortOption(
      stateParams.sortOptions.options
    )

    const filterGroups = stateParams.filterGroups
    const filters = LibraryHelper.processFilterGroups(filterGroups)

    return {
      pagination: {
        page: stateParams.pagination.page
      },
      sort: activeSort,
      filters: filters
    }
  }

  public static merger = (a, b) => {
    const mapA = new Map(a.map((item) => [item.name, item.value]))

    // If `b` is empty, simply return a copy of `a` since there's nothing to merge from `b`
    if (b.length === 0) {
      return a
    }
    // Merge arrays with priority on values from `a`
    const merged = b.map((item) => {
      return mapA.has(item.name)
        ? { name: item.name, value: mapA.get(item.name) }
        : item
    })

    // Include items from `a` not present in `b`
    const additionalItems = a.filter(
      (aItem) => !b.some((bItem) => bItem.name === aItem.name)
    )

    return [...merged, ...additionalItems]
  }
}

export default LibraryHelper
