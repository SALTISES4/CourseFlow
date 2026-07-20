import {
  LibraryContentTypeIn,
  LibraryFiltersIn,
  LibraryOwnershipIn,
  LibrarySearchIn,
  LibrarySortDirectionIn,
  LibrarySortValueIn,
  WorkflowType
} from '@cf/api/gen'
import { _t } from '@cf/utility/Utility.class'
import {
  SearchFilterGroup,
  SearchFilterOption,
  SortOption
} from '@cfComponents/filters/types'

type FilterGroups = { [key: string]: SearchFilterGroup }

export type SearchOptions = {
  pagination: {
    page: number
  }
  sortOptions: {
    options: SortOption[]
  }
  filterGroups: {
    ownershipFilter: SearchFilterGroup
    disciplineFilter: SearchFilterGroup
    contentTypeFilter: SearchFilterGroup
    workflowTypeFilter: SearchFilterGroup
    keywordFilter: SearchFilterGroup
    templateFilter: SearchFilterGroup
    archiveFilter: SearchFilterGroup
    favoritesFilter: SearchFilterGroup
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
          value: LibrarySortValueIn.A_Z,
          label: _t('A - Z')
        },
        {
          value: LibrarySortValueIn.DATE_CREATED,
          label: _t('Date created')
        }
      ]
    },
    filterGroups: {
      // Filter group with dynamically populated options
      ownershipFilter: {
        name: 'type',
        label: _t('Ownership'),
        options: [
          {
            value: null,
            label: _t('All'),
            enabled: true
          },
          {
            value: LibraryOwnershipIn.OWNED,
            label: _t('Owned')
          },
          {
            value: LibraryOwnershipIn.SHARED,
            label: _t('Shared')
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
            label: _t('Projects'),
            value: LibraryContentTypeIn.PROJECT
          },
          {
            label: _t('Workflows'),
            value: LibraryContentTypeIn.WORKFLOW
          }
        ]
      },
      // Filter group with a single selectable options at one time
      workflowTypeFilter: {
        name: 'workflowType',
        label: _t('Workflow Type'),
        options: [
          {
            label: _t('Activity'),
            value: WorkflowType.ACTIVITY
          },
          {
            label: _t('Course'),
            value: WorkflowType.COURSE
          },
          {
            label: _t('Program'),
            value: WorkflowType.PROGRAM
          }
        ]
      },
      // Filter group with no options or value is binary
      templateFilter: {
        name: 'isTemplate',
        label: _t('Templates')
      },
      // Filter group with no options or value is binary
      favoritesFilter: {
        name: 'isFavorite',
        label: _t('Favourites')
      },
      // Filter group with no options or value is binary
      archiveFilter: {
        name: 'isArchive',
        label: _t('Archive')
      },
      // Filter group with a single value
      keywordFilter: {
        name: 'keyword',
        label: _t('Search'),
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
    const relationship = filterGroups.ownershipFilter?.options?.find(
      (option) => option.enabled
    )?.value
    const contentType = filterGroups.contentTypeFilter?.options?.find(
      (option) => option.enabled
    )?.value as LibraryContentTypeIn | null
    const disciplineIds = (filterGroups.disciplineFilter?.options
      ?.filter((option) => option.enabled)
      .map((option) => Number(option.value))
      .filter((value) => Number.isInteger(value)) ?? []) as number[]

    const keyword =
      String(filterGroups.keywordFilter?.value ?? '').trim() || null

    const workflowTypes = filterGroups.workflowTypeFilter?.options
      ?.filter((option) => option.enabled)
      .map((option) => option.value) as WorkflowType[]

    return {
      keyword,
      contentType,
      disciplineIds,
      workflowTypes:
        contentType === LibraryContentTypeIn.PROJECT ? [] : workflowTypes,
      ownership:
        relationship === LibraryOwnershipIn.OWNED ||
        relationship === LibraryOwnershipIn.SHARED
          ? relationship
          : null,

      // Boolean filters are "only when true" for this endpoint.
      isFavorite: filterGroups.favoritesFilter?.value ? true : null,
      isArchived: filterGroups.archiveFilter?.value ? true : null,
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
      ? {
          value: activeSort.value,
          direction: activeSort.direction ?? LibrarySortDirectionIn.DESC
        }
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

    const payload: LibrarySearchIn = {
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
    args: LibrarySearchIn,
    locked: Partial<LibraryFiltersIn>
  ): LibrarySearchIn {
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
