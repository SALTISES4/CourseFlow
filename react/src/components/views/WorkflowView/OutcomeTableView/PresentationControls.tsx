import { WorkflowType } from '@cf/api/gen/types.gen'
import { selectAllTags } from '@cf/features/graph/state/selectors/canonical.selectors'
import { selectAllOutcomes } from '@cf/features/graph/state/selectors/outcomes.selectors'
import { graphUiActions } from '@cf/features/graph/state/slices/graphUi.slice'
import { outcomeTableUiActions } from '@cf/features/graph/state/slices/outcomeTableUi.slice'
import type { AppDispatch, RootState } from '@cf/redux/store'
import { MenuItemType, SimpleMenu } from '@cfComponents/menu/Menu'
import OutcomeTableToolbar from '@cfPages/Workflow/WorkflowTabs/components/menuBar/OutcomeTableToolbar'
import TuneIcon from '@mui/icons-material/Tune'
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap'
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap'
import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

const PresentationControls = ({
  graphUuid,
  workflowType
}: {
  graphUuid: string
  workflowType: WorkflowType
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { t } = useTranslation('workflow')
  const outcomes = useSelector(selectAllOutcomes)
  const tags = useSelector(selectAllTags)
  const hiddenTagIds = useSelector(
    (state: RootState) => state.graph.graphUi.hiddenOutcomeTagIds
  )
  const graphOutcomes = useMemo(
    () => outcomes.filter((outcome) => outcome.graphUuid === graphUuid),
    [graphUuid, outcomes]
  )
  const tagsInUse = useMemo(
    () => new Set(graphOutcomes.flatMap((outcome) => outcome.tagIds)),
    [graphOutcomes]
  )
  const displayedTags = useMemo(
    () =>
      tags
        .filter((tag) => tagsInUse.has(Number(tag.tagId)))
        .sort((a, b) =>
          a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
        ),
    [tags, tagsInUse]
  )
  const header: MenuItemType = {
    content: t('menu.viewSettings'),
    icon: <TuneIcon />,
    showIconInList: true,
    show: true
  }
  const menuItems: MenuItemType[] = [
    {
      uuid: 'expand-all-outcomes',
      content: t('menu.expandOutcomes'),
      action: () =>
        dispatch(
          outcomeTableUiActions.setExpandedOutcomes({
            uuids: graphOutcomes.map((outcome) => outcome.uuid),
            expanded: true
          })
        ),
      icon: <ZoomOutMapIcon />,
      showIconInList: true,
      show: true
    },
    {
      uuid: 'collapse-all-outcomes',
      content: t('menu.collapseOutcomes'),
      action: () =>
        dispatch(
          outcomeTableUiActions.setExpandedOutcomes({
            uuids: [],
            expanded: false
          })
        ),
      icon: <ZoomInMapIcon />,
      showIconInList: true,
      show: true
    }
  ]

  if (displayedTags.length > 0) {
    menuItems.push({
      uuid: 'outcome-table-tags',
      content: (
        <Box>
          <Typography variant="subtitle2">{t('edit.tags')}</Typography>
          {displayedTags.map((tag) => {
            const tagId = Number(tag.tagId)
            return (
              <FormControlLabel
                key={tag.tagId}
                control={
                  <Checkbox
                    checked={!hiddenTagIds.includes(tagId)}
                    onChange={(_, checked) =>
                      dispatch(
                        graphUiActions.setOutcomeTagVisibility({
                          tagId,
                          visible: checked
                        })
                      )
                    }
                    inputProps={{ 'aria-label': tag.label }}
                  />
                }
                label={tag.label}
              />
            )
          })}
        </Box>
      ),
      show: true
    })
  }

  return (
    <Box
      data-test-id="workflow-outcome-table-presentation-controls"
      role="group"
      aria-label={t('outcomeTable.presentationControlsLabel')}
      sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
    >
      <OutcomeTableToolbar workflowType={workflowType} />
      <SimpleMenu
        id="public-outcome-table-view-settings"
        header={header}
        menuItems={menuItems}
      />
    </Box>
  )
}

export default PresentationControls
