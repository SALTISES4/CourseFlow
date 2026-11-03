import {
  ChannelEntity,
  SectionEntity
} from '@cf/features/graph/state/model/types'
import { OutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { displaySystemTitle } from '@cf/i18n/systemTitles'
import { NodeTitle } from '@cfViews/WorkflowView/GraphView/components/Section/Cell/CellNode/useNodeTitle'
import { useTranslation } from 'react-i18next'

import * as Styled from '../styles'

const TableHeader = ({ table }: { table: OutcomeTable }) => {
  const { t } = useTranslation('workflow')

  const groupSource: (SectionEntity | ChannelEntity)[] =
    table.entities[table.groupedBy]

  const groups = groupSource.map((group, index) => {
    const sectionDefaultTitle = t('systemLabels.sectionNumber', {
      number: (group.position ?? 0) + 1
    })

    const groupTitle = displaySystemTitle(
      t,
      group,
      table.groupedBy === 'channels'
        ? t('graph.untitledNodeCategory')
        : sectionDefaultTitle
    )

    const groupNodes = table.groups[index].nodes.map((n) => n.uuid)

    return (
      <>
        <Styled.HeaderLegendWrap key={group.uuid}>
          <Styled.TableLegend>{groupTitle}</Styled.TableLegend>
        </Styled.HeaderLegendWrap>
        {groupNodes.map((nodeUuid) => {
          const node = table.entities.nodes[nodeUuid]
          const color = table.board.columns.colors[node.channelUuid ?? '']

          return (
            <Styled.HeaderLegendWrap key={nodeUuid}>
              <Styled.TableLegend color={color}>
                <NodeTitle node={node} />
              </Styled.TableLegend>
            </Styled.HeaderLegendWrap>
          )
        })}
      </>
    )
  })

  return (
    <Styled.TableHeader>
      <Styled.HeaderLegendWrap />
      {groups}
    </Styled.TableHeader>
  )
}

export default TableHeader
