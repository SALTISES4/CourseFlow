import { DraggableType } from '@cf/components/views/WorkflowView/GraphView/types'
import { TColumn } from '@cf/redux/types/type'
import ThemeHelper from '@cf/utility/ThemeHelper.class'

import { AddTabType } from '../../types'

// TODO: move this to a real selector or something
// Prepare the graph channel data
export function getChannelData(channels: TColumn[]) {
  return channels.map((channel) => ({
    uuid: channel.uuid,
    title: channel.title ?? channel.columnTypeDisplay,
    color: ThemeHelper.getColumnColour({
      columnType: channel.columnType,
      colour: channel.colour
    })
  }))
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
