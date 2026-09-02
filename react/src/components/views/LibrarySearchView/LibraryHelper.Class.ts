import {
  LibraryContentTypeIn,
  LibraryFiltersIn,
  LibraryOwnershipIn,
  LibrarySearchIn,
  LibrarySearchOut,
  LibrarySortDirectionIn,
  LibrarySortValueIn,
  WorkflowType
} from '@cf/api/gen'
import {
  SearchFilterGroup,
  SearchFilterOption,
  SortOption
} from '@cfComponents/filters/types'
import { produce } from 'immer'
import type { TFunction } from 'i18next'

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
  public static createDefaultSearchOptions(
    t: TFunction<'library'>
  ): SearchOptions {
    return {
    pagination: {
      page: 0
    },
    sortOptions: {
      options: [
        {
          value: LibrarySortValueIn.A_Z,
          label: t('sort.alphabetical')
        },
        {
          value: LibrarySortValueIn.DATE_CREATED,
          label: t('sort.dateCreated')
        }
      ]
    },
    filterGroups: {
      // Filter group with dynamically populated options
      ownershipFilter: {
        name: 'type',
        label: t('filters.ownership'),
        options: [
          {
            value: LibraryOwnershipIn.OWNED,
            label: t('filters.owned')
          },
          {
            value: LibraryOwnershipIn.SHARED,
            label: t('filters.shared')
          }
        ]
      },
      // Filter group with dynamically populated options
      disciplineFilter: {
        name: 'discipline',
        label: t('filters.discipline'),
        selectMultiple: true,
        options: []
      },
      // Filter group with a single selectable options at one time
      contentTypeFilter: {
        name: 'contentType',
        label: t('filters.type'),
        options: [
          {
            label: t('filters.projects'),
            value: LibraryContentTypeIn.PROJECT
          },
          {
            label: t('filters.workflows'),
            value: LibraryContentTypeIn.WORKFLOW
          }
        ]
      },
      // Filter group with a single selectable options at one time
      workflowTypeFilter: {
        name: 'workflowType',
        label: t('filters.workflowType'),
        options: [
          {
            label: t('filters.activity'),
            value: WorkflowType.ACTIVITY
          },
          {
            label: t('filters.course'),
            value: WorkflowType.COURSE
          },
          {
            label: t('filters.program'),
            value: WorkflowType.PROGRAM
          }
        ]
      },
      // Filter group with no options or value is binary
      templateFilter: {
        name: 'isTemplate',
        label: t('filters.templates')
      },
      // Filter group with no options or value is binary
      favoritesFilter: {
        name: 'isFavorite',
        label: t('filters.favourites')
      },
      // Filter group with no options or value is binary
      archiveFilter: {
        name: 'isArchive',
        label: t('filters.archive')
      },
      // Filter group with a single value
      keywordFilter: {
        name: 'keyword',
        label: t('filters.search'),
        value: ''
      }
    }
    }
  }

  public static relabelSearchOptions(
    current: SearchOptions,
    translated: SearchOptions
  ): SearchOptions {
    return produce(current, (draft) => {
      draft.sortOptions.options.forEach((option) => {
        const translatedOption = translated.sortOptions.options.find(
          (candidate) => candidate.value === option.value
        )
        if (translatedOption) option.label = translatedOption.label
      })

      Object.keys(draft.filterGroups).forEach((key) => {
        const groupKey = key as keyof SearchOptions['filterGroups']
        const translatedGroup = translated.filterGroups[groupKey]
        const group = draft.filterGroups[groupKey]
        group.label = translatedGroup.label
        group.options?.forEach((option) => {
          const translatedOption = translatedGroup.options?.find(
            (candidate) => candidate.value === option.value
          )
          if (translatedOption) option.label = translatedOption.label
        })
      })
    })
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
    filterGroups: SearchOptions['filterGroups']
  ): LibraryFiltersIn => {
    const relationship = filterGroups.ownershipFilter?.options?.find(
      (option) => option.enabled
    )?.value
    const contentType = filterGroups.contentTypeFilter?.options?.find(
      (option) => option.enabled
    )?.value as LibraryContentTypeIn | null
    const disciplineCodes =
      filterGroups.disciplineFilter?.options
        ?.filter((option) => option.enabled)
        .map((option) => String(option.value)) ?? []

    const keyword =
      String(filterGroups.keywordFilter?.value ?? '').trim() || null

    const workflowTypes = filterGroups.workflowTypeFilter?.options
      ?.filter((option) => option.enabled)
      .map((option) => option.value) as WorkflowType[]

    return {
      keyword,
      contentType,
      disciplineCodes,
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
    const activeLockedFilters = Object.fromEntries(
      Object.entries(locked).filter(([, value]) => value != null)
    ) as Partial<LibraryFiltersIn>
    const mergedFilters: LibraryFiltersIn = {
      ...(base.filters ?? {}),
      ...activeLockedFilters
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

  public static translateLockedFiltersToInitialSearchOptions(
    locked: Partial<LibraryFiltersIn>,
    searchOptions: SearchOptions
  ) {
    return produce(searchOptions, (draft) => {
      draft.filterGroups.favoritesFilter.value = locked.isFavorite ?? false
      draft.filterGroups.templateFilter.value = locked.isTemplate ?? false
      draft.filterGroups.archiveFilter.value = locked.isArchived ?? false
    })
  }

  public static formatResultsSummary(
    data: LibrarySearchOut,
    t: TFunction<'library'>
  ) {
    const { currentPage, resultsPerPage, totalResults } = data.meta
    const rangeStart = currentPage * resultsPerPage + 1
    const rangeEnd = Math.min(totalResults, rangeStart + data.items.length - 1)
    const range =
      rangeStart === rangeEnd ? String(rangeStart) : `${rangeStart}-${rangeEnd}`

    return t('results.summary', { range, count: totalResults })
  }
}

export default LibraryHelper
