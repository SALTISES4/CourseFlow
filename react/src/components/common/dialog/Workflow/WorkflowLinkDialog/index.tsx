import {
  LibraryContentTypeIn,
  LibraryItemOut,
  WorkflowType,
  getWorkflow,
  searchLibrary
} from '@cf/api/gen'
import {
  selectGraphByUuid,
  selectNodeByUuid
} from '@cf/features/graph/state/selectors/canonical.selectors'
import { linkNodeWorkflow } from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import type { AppDispatch } from '@cf/redux/store'
import { formatLibraryObjects } from '@cf/utility/marshalling/libraryCards'
import WorkflowCardWrapper from '@cfComponents/cards/WorkflowCardWrapper'
import { StyledDialog } from '@cfComponents/dialog/styles'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { GridWrap } from '@cfMUI/helper'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { debounce } from '@mui/material/utils'
import Fuse from 'fuse.js'
import { produce } from 'immer'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

type StateType = {
  selected: string | null
  workflowData: LibraryItemOut[] | null
  filteredWorkflows: LibraryItemOut[] | null
  loading: boolean
  loadError: boolean
}

const initialState: StateType = {
  selected: null,
  workflowData: null,
  filteredWorkflows: null,
  loading: false,
  loadError: false
}

function NodeLinkWorkflowDialog() {
  const { t } = useTranslation('workflow')
  const { t: tLibrary } = useTranslation('library')
  const { t: tCommon } = useTranslation('common')
  const dispatch = useDispatch<AppDispatch>()
  const { payload, show, onClose } = useDialog(DialogMode.NODE_LINK_WORKFLOW)
  const nodeSelector = useMemo(
    () => (payload?.uuid ? selectNodeByUuid(payload.uuid) : () => null),
    [payload?.uuid]
  )
  const node = useSelector(nodeSelector)
  const graphUuid = payload?.graphUuid ?? node?.graphUuid ?? ''
  const graphSelector = useMemo(
    () => (graphUuid ? selectGraphByUuid(graphUuid) : () => undefined),
    [graphUuid]
  )
  const graph = useSelector(graphSelector)
  const parentWorkflowType = graph?.workflowType
  const targetWorkflowType =
    parentWorkflowType === 'course'
      ? WorkflowType.ACTIVITY
      : parentWorkflowType === 'program'
        ? WorkflowType.COURSE
        : null
  const dialogTitle =
    parentWorkflowType === 'program'
      ? t('linkDialog.courseTitle')
      : t('linkDialog.activityTitle')

  const [state, setState] = useState<StateType>(initialState)
  const { selected, workflowData, filteredWorkflows, loading, loadError } =
    state
  const filteredResults = formatLibraryObjects(
    filteredWorkflows ?? workflowData ?? [],
    tLibrary
  )

  const onDialogClose = useCallback(() => {
    onClose()
    setState(initialState)
  }, [onClose])

  const onWorkflowSelect = useCallback(
    (uuid: string) => () => {
      setState(
        produce((draft) => {
          draft.selected = uuid
        })
      )
    },
    []
  )

  const onSubmit = useCallback(() => {
    if (!payload?.uuid || !selected || !graphUuid) {
      return
    }
    const linked = workflowData?.find((workflow) => workflow.uuid === selected)
    void dispatch(
      linkNodeWorkflow({
        graphUuid,
        nodeUuid: payload.uuid,
        workflowUuid: selected,
        linkedWorkflow: linked
          ? { uuid: linked.uuid, title: linked.title }
          : { uuid: selected, title: '' }
      })
    ).then(onDialogClose)
  }, [
    dispatch,
    graphUuid,
    onDialogClose,
    payload?.uuid,
    selected,
    workflowData
  ])

  const onSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value.trim()
      if (!workflowData) {
        return
      }
      if (!value) {
        setState(
          produce((draft) => {
            draft.filteredWorkflows = null
            draft.selected = workflowData[0]?.uuid ?? null
          })
        )
        return
      }

      const matches = new Fuse(workflowData, {
        keys: ['title'],
        threshold: 0.2
      })
        .search(value)
        .map((result) => result.item)
      setState(
        produce((draft) => {
          draft.filteredWorkflows = matches
          draft.selected = matches[0]?.uuid ?? null
        })
      )
    },
    [workflowData]
  )

  useEffect(() => {
    if (
      !show ||
      workflowData !== null ||
      !payload?.uuid ||
      !graph?.workflowUuid ||
      !targetWorkflowType
    ) {
      return
    }

    let cancelled = false
    setState(
      produce((draft) => {
        draft.loading = true
        draft.loadError = false
      })
    )

    const loadWorkflows = async () => {
      try {
        const { data: rootWorkflow } = await getWorkflow({
          path: { uuid: graph.workflowUuid! },
          throwOnError: true
        })
        if (!rootWorkflow.item.projectUuid) {
          throw new Error('Parent workflow is not assigned to a project')
        }
        const { data } = await searchLibrary({
          body: {
            pagination: { page: 0, resultsPerPage: 100 },
            filters: {
              contentType: LibraryContentTypeIn.WORKFLOW,
              projectUuid: rootWorkflow.item.projectUuid,
              workflowTypes: [targetWorkflowType],
              isArchived: false
            }
          },
          throwOnError: true
        })
        if (!cancelled) {
          setState(
            produce((draft) => {
              draft.workflowData = data.items
              draft.selected = data.items[0]?.uuid ?? null
              draft.loading = false
            })
          )
        }
      } catch {
        if (!cancelled) {
          setState(
            produce((draft) => {
              draft.loading = false
              draft.loadError = true
            })
          )
        }
      }
    }

    void loadWorkflows()
    return () => {
      cancelled = true
    }
  }, [
    graph?.workflowUuid,
    payload?.uuid,
    show,
    targetWorkflowType,
    workflowData
  ])

  return (
    <StyledDialog open={show} fullWidth maxWidth="lg" onClose={onDialogClose}>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ px: 6 }}>
          <TextField
            variant="standard"
            label={t('linkDialog.search')}
            fullWidth
            disabled={loading || loadError || workflowData === null}
            onChange={debounce(onSearchChange, 400)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          {loading && <Loader />}
          {loadError && (
            <Box sx={{ py: 4 }}>{t('linkDialog.loadFailed')}</Box>
          )}
          {!loading &&
            !loadError &&
            workflowData !== null &&
            (filteredResults.length > 0 ? (
              <GridWrap sx={{ mt: 4 }}>
                {filteredResults.map((item) => (
                  <WorkflowCardWrapper
                    key={`workflow_${item.uuid}`}
                    {...item}
                    isSelected={item.uuid === selected}
                    onClick={onWorkflowSelect(item.uuid)}
                  />
                ))}
              </GridWrap>
            ) : (
              <Box sx={{ py: 4 }}>
                {filteredWorkflows !== null
                  ? t('linkDialog.noExactMatches')
                  : parentWorkflowType === 'program'
                    ? t('linkDialog.noCourse')
                    : t('linkDialog.noActivity')}
              </Box>
            ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onDialogClose}>
          {tCommon('actions.cancel')}
        </Button>
        <Button
          variant="contained"
          disabled={!selected || !graphUuid}
          onClick={onSubmit}
        >
          {parentWorkflowType === 'program'
            ? t('linkDialog.linkCourse')
            : t('linkDialog.linkActivity')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default NodeLinkWorkflowDialog
