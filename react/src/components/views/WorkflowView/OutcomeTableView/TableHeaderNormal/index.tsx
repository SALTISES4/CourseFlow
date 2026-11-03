import {
  OutcomeTable,
  contextLabels
} from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { displaySystemTitle } from '@cf/i18n/systemTitles'
import { NodeTitle } from '@cfViews/WorkflowView/GraphView/components/Section/Cell/CellNode/useNodeTitle'
import { useTranslation } from 'react-i18next'

import * as Styled from '../styles'

const TableHeader = ({ table }: { table: OutcomeTable }) => {
  const { t } = useTranslation('workflow')

  const groups = table.groups.map((group, index) => {
    let groupTitle = ''
    if (table.groupedBy === 'context') {
      groupTitle = contextLabels[group.uuid]
    } else {
      const entity = table.entities[table.groupedBy][index]

      const sectionDefaultTitle = t('systemLabels.sectionNumber', {
        number: (entity.position ?? 0) + 1
      })

      groupTitle = displaySystemTitle(
        t,
        entity,
        table.groupedBy === 'channels'
          ? t('graph.untitledNodeCategory')
          : sectionDefaultTitle
      )
    }

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
