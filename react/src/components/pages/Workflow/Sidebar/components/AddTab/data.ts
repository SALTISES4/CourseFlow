import type { ChannelEntity } from '@cf/features/graph/state/model/types'
import { defaultColumnSettings } from '@cf/utility/constants'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { AddTabType } from '@cfSidebar/types'
import { DraggableType } from '@cfViews/WorkflowView/GraphView/types'

const CYCLIC_DEFAULT_COLUMN_TYPES: number[] = Object.keys(defaultColumnSettings)
  .filter((key) => typeof key !== 'symbol' && key !== 'new-column')
  .map(Number)
  .filter((n) => !Number.isNaN(n))
  .sort((a, b) => a - b)

/** Map canonical graph channels to sidebar draggable node-category rows. */
export function getChannelData(channels: ChannelEntity[]) {
  const types = CYCLIC_DEFAULT_COLUMN_TYPES
  const typeCount = types.length > 0 ? types.length : 1

  return channels.map((channel, idx) => {
    const columnType = types.length > 0 ? types[idx % typeCount] : 0
    return {
      uuid: channel.uuid,
      title: channel.title,
      color: ThemeHelper.getColumnColour({
        columnType,
        colour: null
      })
    }
  })
}
