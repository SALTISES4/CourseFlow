import { TColumn } from '@cf/redux/types/type'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { DraggableType } from '@cfViews/WorkflowView/WorkflowEditView/types'

import { AddTabType } from '../../types'

// TODO: move this to a real selector or something
// Prepare the graph channel data
export function getChannelData(channels: TColumn[]) {
  return channels.map((channel) => ({
    id: channel.id,
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
          id: '1',
          label: 'Block 1'
        },
        {
          id: '2',
          label: 'Block 2'
        },
        {
          id: '3',
          label: 'Block 3'
        }
      ]
    },
    {
      type: DraggableType.SIDEBAR_STRATEGY,
      title: 'Strategies',
      blocks: [
        {
          id: '1',
          label: 'Jigsaw'
        },
        {
          id: '2',
          label: 'Peer instruction'
        },
        {
          id: '3',
          label: 'Toolkit'
        },
        {
          id: '4',
          label: 'Case studies'
        },
        {
          id: '5',
          label: 'Gallery walk'
        },
        {
          id: '6',
          label: 'Reflective writing'
        },
        {
          id: '7',
          label: 'Two stage exam'
        }
      ]
    }
  ]
}

export default data
