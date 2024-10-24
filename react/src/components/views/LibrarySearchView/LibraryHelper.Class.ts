import { WorkflowType, WorkspaceType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import {
  SortDirection,
  SortValueOption
} from '@cfComponents/filters/SortableFilterButton'
import {
  SearchFilterGroup,
  SearchFilterOption,
  SortOption
} from '@cfComponents/filters/types'
import {
  FilterResult,
  LibraryObjectsSearchQueryArgs
} from '@XMLHTTP/types/args'
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
          value: SortValueOption.DATE_MODIFIED,
          label: 'Recent'
        },
        {
          value: SortValueOption.A_Z,
          label: 'A - Z'
        },
        {
          value: SortValueOption.DATE_CREATED,
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
            value: 'favorites',
            label: _t('Favorites')
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
            label: 'Project',
            value: WorkflowType.PROGRAM
          },

          {
            label: 'Project',
            value: WorkflowType.COURSE
          },
          {
            label: 'Project',
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
      value: SortValueOption
      direction?: SortDirection
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
  ): FilterResult => {
    // Helper function to get enabled options for selectMultiple filters
    const getEnabledValues = (options: Option[]): any[] =>
      options.filter((option) => option.enabled).map((option) => option.value)

    // Helper function to get the first enabled option
    const getFirstEnabledValue = (options: Option[]): any | undefined =>
      options.find((option) => option.enabled)?.value

    return Object.values(filterGroups)
      .reduce<FilterResult>((acc, filter) => {
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

        if (options) {
          if (selectMultiple) {
            const enabledValues = getEnabledValues(options)
            if (enabledValues.length > 0)
              acc.push({ name, value: enabledValues })
          } else {
            const enabledValue = getFirstEnabledValue(options)
            if (
              enabledValue !== undefined &&
              enabledValue !== null &&
              enabledValue !== ''
            )
              acc.push({ name, value: enabledValue })
          }
        } else if (value !== undefined) {
          acc.push({ name, value })
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
  ): { value: SortValueOption; direction: SortDirection } | null => {
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
  ): LibraryObjectsSearchQueryArgs {
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
}

export default LibraryHelper
