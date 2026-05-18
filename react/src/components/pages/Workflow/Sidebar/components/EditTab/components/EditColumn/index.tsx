import ColorPicker from '@cf/components/common/UIPrimitives/ColorPicker'
import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '@cf/components/pages/Workflow/Sidebar/styles'
import type { ChannelEntity } from '@cf/features/graph/state/model/types'
import {
  selectChannelByUuid,
  selectChannelThemeColumnType
} from '@cf/features/graph/state/selectors/canonical.selectors'
import { sidebarChangeTab } from '@cf/features/sidebar/state/sidebar.slice'
import { RootState } from '@cf/redux/store'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

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
  const columnColourHex = ThemeHelper.getColumnColour({
    columnType: themeColumnType,
    colour: null
  })

  const [color, setColor] = useState(columnColourHex)
  const [titleDraft, setTitleDraft] = useState(channel.title ?? '')

  useEffect(() => {
    setTitleDraft(channel.title ?? '')
  }, [channel.uuid, channel.title])

  const onTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTitleDraft(e.target.value)
    // TODO(graph-state): persist channel title via graph/channel mutation API when available.
  }

  const onColorChange = (next: string) => {
    setColor(next)
    // TODO(graph-state): canonical ChannelEntity has no per-channel colour; colours follow cyclic theme.
  }

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
          />
          <ColorPicker size="small" color={color} onChange={onColorChange} />
        </Stack>
      </SidebarContent>
      <SidebarActions>
        <Button variant="contained" color="secondary">
          {_t('Duplicate')}
        </Button>
        <Button variant="contained" color="secondary">
          {_t('Delete')}
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export default EditColumn
