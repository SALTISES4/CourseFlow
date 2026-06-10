import {
  LibraryContentTypeIn,
  LibraryFiltersIn,
  LibraryOwnershipIn,
  LibrarySortDirectionIn,
  LibrarySortValueIn
} from '@cf/api/gen'
import { _t } from '@cf/utility/Utility.class'
import {
  SearchFilterGroup,
  SearchFilterOption,
  SortOption
} from '@cfComponents/filters/types'
import { WorkflowType } from '@cfPages/Workflow/types'

type FilterGroups = { [key: string]: SearchFilterGroup }

export type TypedLibrarySearchArgs = {
  pagination?: {
    page?: number
    resultsPerPage?: number
  }
  sort?: {
    value?: LibrarySortValueIn
    direction?: LibrarySortDirectionIn
  } | null
  filters?: LibraryFiltersIn | null
}

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
    contentTypeFilter: SearchFilterGroup
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
          label: _t('Recent')
        },
        {
          value: LibrarySortValueIn.A_Z,
          label: _t('A - Z')
        },
        {
          value: LibrarySortValueIn.DATE_CREATED,
          label: _t('Creation date')
        }
      ]
    },
    filterGroups: {
      // Filter group with dynamically populated options
      relationshipFilter: {
        name: 'type',
        label: _t('Type'),
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
      contentTypeFilter: {
        name: 'contentType',
        label: _t('Type'),
        options: [
          {
            label: _t('All'),
            value: null,
            enabled: true
          },
          {
            label: _t('Project'),
            value: 'project'
          },
          {
            label: _t('Program'),
            value: WorkflowType.PROGRAM
          },

          {
            label: _t('Course'),
            value: WorkflowType.COURSE
          },
          {
            label: _t('Activity'),
            value: WorkflowType.ACTIVITY
          },
          {
            label: _t('Task'),
            value: WorkflowType.TASK
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
  ): LibraryFiltersIn => {
    const relationship = filterGroups.relationshipFilter?.options?.find(
      (option) => option.enabled
    )?.value
    const contentSelection = filterGroups.contentTypeFilter?.options?.find(
      (option) => option.enabled
    )?.value
    const disciplineIds = (filterGroups.disciplineFilter?.options
      ?.filter((option) => option.enabled)
      .map((option) => Number(option.value))
      .filter((value) => Number.isInteger(value)) ?? []) as number[]

    const keyword =
      String(filterGroups.keywordFilter?.value ?? '').trim() || null

    const workflowTypes = (
      ['activity', 'course', 'program', 'task'] as const
    ).includes(contentSelection as WorkflowType)
      ? [contentSelection as WorkflowType]
      : []

    const contentType: LibraryContentTypeIn | null =
      contentSelection === LibraryContentTypeIn.PROJECT
        ? LibraryContentTypeIn.PROJECT
        : workflowTypes.length > 0 || contentSelection === 'workflow'
          ? LibraryContentTypeIn.WORKFLOW
          : null

    return {
      keyword,
      contentType,
      disciplineIds,
      workflowTypes,
      ownership:
        relationship === LibraryOwnershipIn.OWNED ||
        relationship === LibraryOwnershipIn.SHARED
          ? relationship
          : null,
      isFavorite: relationship === 'favourited' ? true : null,
      // Boolean filters are "only when true" for this endpoint.
      isTemplate: filterGroups.templateFilter?.value ? true : null
    }
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
  ): TypedLibrarySearchArgs {
    const activeSort = LibraryHelper.getActiveSortOption(
      stateParams.sortOptions.options
    )

    const filterGroups = stateParams.filterGroups
    const filters = LibraryHelper.processFilterGroups(filterGroups)

    const payload: TypedLibrarySearchArgs = {
      pagination: {
        page: stateParams.pagination.page,
        resultsPerPage: 10
      },
      sort: activeSort,
      filters: filters
    }

    return payload
  }

  public static applyLockedFilters(
    args: TypedLibrarySearchArgs,
    locked: Partial<LibraryFiltersIn>
  ): TypedLibrarySearchArgs {
    const base = args ?? {}
    const mergedFilters: LibraryFiltersIn = {
      ...(base.filters ?? {}),
      ...locked
    }

    if (
      mergedFilters.contentType === LibraryContentTypeIn.PROJECT &&
      mergedFilters.workflowTypes?.length
    ) {
      mergedFilters.workflowTypes = []
    }

    return {
      ...base,
      filters: mergedFilters
    }
  }
}

export default LibraryHelper
