import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import type { ChannelEntity } from '@cf/features/graph/state/model/types'
import {
  selectChannelByUuid,
  selectChannelThemeColumnType
} from '@cf/features/graph/state/selectors/canonical.selectors'
import {
  changeChannelMeta,
  insertChannelBelow
} from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { sidebarChangeTab } from '@cf/features/sidebar/state/sidebar.slice'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import type { AppDispatch, RootState } from '@cf/redux/store'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import ColorPicker from '@cfComponents/UIPrimitives/ColorPicker'
import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '@cfSidebar/styles'
import { debounce } from '@mui/material'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

function resolveChannelColour(
  channel: ChannelEntity,
  themeColumnType: number
): string {
  if (channel.colour) {
    return channel.colour
  }
  return ThemeHelper.getColumnColour({
    columnType: themeColumnType,
    colour: null
  })
}

const EditColumn = ({ columnId }: { columnId: string }) => {
  const dispatch = useDispatch()
  const graphUuid = useSelector(
    (state: RootState) => state.sidebar.edit.parentId ?? ''
  )
  const channelSelector = useMemo(
    () => selectChannelByUuid(columnId),
    [columnId]
  )
  const channel = useSelector(channelSelector)
  const themeColumnTypeSelector = useMemo(
    () => selectChannelThemeColumnType(graphUuid, columnId),
    [graphUuid, columnId]
  )
  const themeColumnType = useSelector(themeColumnTypeSelector)

  useEffect(() => {
    if (!channel && columnId) {
      dispatch(sidebarChangeTab({ tab: null, collapsed: true }))
    }
  }, [channel, columnId, dispatch])

  if (!channel) {
    return null
  }

  return <EditColumnForm channel={channel} themeColumnType={themeColumnType} />
}

const EditColumnForm = ({
  channel,
  themeColumnType
}: {
  channel: ChannelEntity
  themeColumnType: number
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { dispatch: dialogDispatch } = useDialog()
  const canEdit = useResourcePermission(
    WorkflowPermission.NODE_CATEGORY_MANAGEMENT
  )

  const [color, setColor] = useState(() =>
    resolveChannelColour(channel, themeColumnType)
  )
  const [titleDraft, setTitleDraft] = useState(channel.title ?? '')

  useEffect(() => {
    setTitleDraft(channel.title ?? '')
    setColor(resolveChannelColour(channel, themeColumnType))
  }, [channel, themeColumnType])

  const debouncedPersistMeta = useMemo(
    () =>
      debounce((meta: { title?: string; colour?: string }) => {
        void dispatch(
          changeChannelMeta({
            graphUuid: channel.graphUuid,
            channelUuid: channel.uuid,
            meta
          })
        )
      }, 300),
    [channel.graphUuid, channel.uuid, dispatch]
  )

  const onTitleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!canEdit) {
        return
      }
      const value = e.target.value
      setTitleDraft(value)
      debouncedPersistMeta({ title: value })
    },
    [canEdit, debouncedPersistMeta]
  )

  const onColorChange = useCallback(
    (next: string) => {
      if (!canEdit) {
        return
      }
      const newColor = next || '#CFD8DC'

      setColor(newColor)
      debouncedPersistMeta({ colour: newColor })
    },
    [canEdit, debouncedPersistMeta]
  )

  useEffect(() => () => debouncedPersistMeta.clear(), [debouncedPersistMeta])

  const onDuplicate = useCallback(() => {
    dispatch(
      insertChannelBelow({
        graphUuid: channel.graphUuid,
        channelUuid: channel.uuid,
        duplicate: true
      })
    )
  }, [channel.graphUuid, channel.uuid, dispatch])

  const onDelete = useCallback(() => {
    dialogDispatch(DialogMode.WORKFLOW_DELETE_NODE_CATEGORY, {
      uuid: channel.uuid,
      graphUuid: channel.graphUuid
    })
  }, [channel.graphUuid, channel.uuid, dialogDispatch])

  return (
    <SidebarInnerWrap>
      <SidebarContent>
        <SidebarTitle as="h3" variant="h6">
          {_t('Edit node category')}
        </SidebarTitle>
        <Stack direction="column" gap={3}>
          <TextField
            variant="outlined"
            label={_t('Title')}
            size="small"
            value={titleDraft}
            onChange={onTitleChange}
            disabled={!canEdit}
          />
          <ColorPicker
            size="small"
            color={color}
            onChange={onColorChange}
            disabled={!canEdit}
          />
        </Stack>
      </SidebarContent>
      <SidebarActions>
        <Button
          variant="contained"
          color="secondary"
          onClick={onDuplicate}
          disabled={!canEdit}
        >
          {_t('Duplicate')}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={onDelete}
          disabled={!canEdit}
        >
          {_t('Delete')}
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export default EditColumn
