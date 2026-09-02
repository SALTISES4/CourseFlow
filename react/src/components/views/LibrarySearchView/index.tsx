import {
  LibraryContentTypeIn,
  LibraryFiltersIn,
  LibrarySearchIn
} from '@cf/api/gen'
import { useLibrarySearch } from '@cf/api/wrappedHooks'
import { useReferenceData } from '@cf/hooks/useReferenceData'
import { useReferenceLabels } from '@cf/i18n/referenceLabels'
import type { FilterMultiselectOption } from '@cfComponents/filters/FilterMultiselect'
import Pagination from '@cfComponents/UIPrimitives/Pagination'
import { GridWrap, OuterContentWrap } from '@cfMUI/helper'
import LibraryHelper, {
  SearchOptions
} from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { produce } from 'immer'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import ContentTypeFilter from './Filters/ContentType'
import DisciplineFilter from './Filters/Discipline'
import OwnershipFilter from './Filters/Ownership'
import SearchFilter from './Filters/Search'
import SortFilter from './Filters/Sort'
import ToggleArchive from './Filters/ToggleArchive'
import ToggleFavorite from './Filters/ToggleFavorite'
import ToggleTemplate from './Filters/ToggleTemplate'
import WorkflowTypeFilter from './Filters/WorkflowType'
import Results, { type ResultsProps } from './Results'

export type LibraryFilterConfig = {
  pagination?: boolean
  sortOptions?: boolean
  errorMessage?: string
  initialContentType?: LibraryContentTypeIn
  filterGroups?: Partial<Record<keyof SearchOptions['filterGroups'], boolean>>
}

/*******************************************************
 * see:  https://docs.google.com/document/d/1LgSedmw-U6mDF8S48I3gMbaohfliZetki6AJAeIKKLw/edit?tab=t.0#heading=h.seafxrns9x1f
 *******************************************************/
type PropsType = {
  config: LibraryFilterConfig
  lockedFilters?: Partial<LibraryFiltersIn>
  override?: ResultsProps['override']
}

const LibrarySearchView = ({
  config,
  lockedFilters = {},
  override
}: PropsType) => {
  // all base filters on by default (opt-out)
  // all filter groups off by default (opt-in)
  const configDefaults: LibraryFilterConfig = {
    pagination: true,
    sortOptions: true,
    filterGroups: {
      ownershipFilter: false,
      disciplineFilter: false,
      contentTypeFilter: false,
      keywordFilter: false,
      templateFilter: false
    }
  }

  const filters: LibraryFilterConfig = {
    ...configDefaults,
    ...config,
    filterGroups: {
      ...configDefaults.filterGroups,
      ...config.filterGroups
    }
  }

  const filterGroups = filters.filterGroups ?? {}

  /*******************************************************
   * HOOKS
   *******************************************************/
  const { t } = useTranslation('library')
  const translatedDefaults = useMemo(
    () => LibraryHelper.createDefaultSearchOptions(t),
    [t]
  )
  // these are the UI filters, they represent the state of the UI grouping, separated into different sections
  const [searchFilterState, setSearchFilterState] = useState<SearchOptions>(
    () => {
      const defaults =
        LibraryHelper.translateLockedFiltersToInitialSearchOptions(
          lockedFilters,
          translatedDefaults
        )

      return produce(defaults, (draft) => {
        if (!filters.initialContentType) {
          return
        }

        const initialOption =
          draft.filterGroups.contentTypeFilter.options?.find(
            (option) => option.value === filters.initialContentType
          )

        if (!initialOption) {
          return
        }

        const current = draft.filterGroups.contentTypeFilter.options ?? []
        draft.filterGroups.contentTypeFilter.options =
          LibraryHelper.updateFilterOptions(current, initialOption)
      })
    }
  )

  useEffect(() => {
    setSearchFilterState((current) =>
      LibraryHelper.relabelSearchOptions(current, translatedDefaults)
    )
  }, [translatedDefaults])

  const searchArgs = useMemo(
    () =>
      LibraryHelper.applyLockedFilters(
        LibraryHelper.reduceStateToSearchArgs(searchFilterState),
        lockedFilters
      ),
    [lockedFilters, searchFilterState]
  )

  /*******************************************************
   * QUERY HOOKS
   *******************************************************/
  const { data, isLoading, isError, error } = useLibrarySearch(searchArgs)
  const { data: referenceData } = useReferenceData()
  const { disciplineLabel, collator } = useReferenceLabels()

  const disciplineOptions: FilterMultiselectOption[] = useMemo(() => {
    const allowedDisciplineCodes = new Set(
      data?.meta?.allowed?.disciplines?.map((option) => option.code) ?? []
    )

    return [...(referenceData?.disciplines ?? [])]
      .map((option) => ({
        value: option.code,
        label: disciplineLabel(option.code),
        disabled: Boolean(data) && !allowedDisciplineCodes.has(option.code)
      }))
      .sort((a, b) => collator.compare(a.label, b.label))
  }, [collator, data, disciplineLabel, referenceData])

  return (
    <OuterContentWrap>
      <Toolbar
        disableGutters
        sx={{ mt: 4, mb: 4 }}
        data-test-id="library-filter-toolbar"
      >
        <Stack
          direction="row"
          spacing={2}
          justifyContent="space-between"
          style={{ width: '100%' }}
        >
          <Stack direction="row" spacing={2}>
            <SortFilter
              show={Boolean(filters.sortOptions)}
              options={searchFilterState.sortOptions.options}
              setSearchFilterState={setSearchFilterState}
            />
            <DisciplineFilter
              show={Boolean(filterGroups.disciplineFilter)}
              options={disciplineOptions}
              setSearchFilterState={setSearchFilterState}
            />
            <OwnershipFilter
              show={Boolean(filterGroups.ownershipFilter)}
              filterGroup={searchFilterState.filterGroups.ownershipFilter}
              setSearchFilterState={setSearchFilterState}
            />
            <ContentTypeFilter
              show={Boolean(filterGroups.contentTypeFilter)}
              filterGroup={searchFilterState.filterGroups.contentTypeFilter}
              setSearchFilterState={setSearchFilterState}
            />
            <WorkflowTypeFilter
              show={Boolean(filterGroups.workflowTypeFilter)}
              searchArgs={searchArgs}
              filterGroup={searchFilterState.filterGroups.workflowTypeFilter}
              setSearchFilterState={setSearchFilterState}
            />

            {/* NOTE: we could merge these into one generic, benefits debatable */}
            <ToggleFavorite
              show={Boolean(filterGroups.favoritesFilter)}
              filterGroup={searchFilterState.filterGroups.favoritesFilter}
              setSearchFilterState={setSearchFilterState}
            />
            <ToggleTemplate
              show={Boolean(filterGroups.templateFilter)}
              filterGroup={searchFilterState.filterGroups.templateFilter}
              setSearchFilterState={setSearchFilterState}
            />
            <ToggleArchive
              show={Boolean(filterGroups.archiveFilter)}
              filterGroup={searchFilterState.filterGroups.archiveFilter}
              setSearchFilterState={setSearchFilterState}
            />
          </Stack>
          <SearchFilter setSearchFilterState={setSearchFilterState} />
        </Stack>
      </Toolbar>

      {!isLoading && !isError && data?.items.length ? (
        <Typography sx={{ mb: 2 }}>
          {LibraryHelper.formatResultsSummary(data, t)}
        </Typography>
      ) : null}

      <GridWrap data-test-id="library-results">
        <Results
          data={data}
          error={error}
          isError={isError}
          isLoading={isLoading}
          errorMessage={filters.errorMessage}
          override={override}
        />
      </GridWrap>

      {!filters.pagination || !data || data.meta.pageCount <= 1 ? null : (
        <Pagination
          current={data.meta.currentPage + 1}
          pages={data.meta.pageCount}
          onChange={(page) =>
            setSearchFilterState(
              produce((draft) => {
                draft.pagination.page = page
              })
            )
          }
        />
      )}
    </OuterContentWrap>
  )
}

export default LibrarySearchView
