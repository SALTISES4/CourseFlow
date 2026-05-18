import { DraggableType } from '@cf/components/views/WorkflowView/GraphView/types'
import type { ChannelEntity } from '@cf/features/graph/state/model/types'
import { defaultColumnSettings } from '@cf/utility/constants'
import ThemeHelper from '@cf/utility/ThemeHelper.class'

import { AddTabType } from '../../types'

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

const data: AddTabType = {
  title: 'Add to workflow',
  subtitle: 'Drag and drop to add nodes.',
  groups: [
    {
      type: DraggableType.SIDEBAR_REUSABLE,
      title: 'Reusable blocks',
      blocks: [
        {
          uuid: '1',
          label: 'Block 1'
        },
        {
          uuid: '2',
          label: 'Block 2'
        },
        {
          uuid: '3',
          label: 'Block 3'
        }
      ]
    },
    {
      type: DraggableType.SIDEBAR_STRATEGY,
      title: 'Strategies',
      blocks: [
        {
          uuid: '1',
          label: 'Jigsaw'
        },
        {
          uuid: '2',
          label: 'Peer instruction'
        },
        {
          uuid: '3',
          label: 'Toolkit'
        },
        {
          uuid: '4',
          label: 'Case studies'
        },
        {
          uuid: '5',
          label: 'Gallery walk'
        },
        {
          uuid: '6',
          label: 'Reflective writing'
        },
        {
          uuid: '7',
          label: 'Two stage exam'
        }
      ]
    }
  ]
}

export default data
