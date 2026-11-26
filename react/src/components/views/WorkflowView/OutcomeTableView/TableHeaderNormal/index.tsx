import { OutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { useReferenceLabels } from '@cf/i18n/referenceLabels'
import { displaySystemTitle } from '@cf/i18n/systemTitles'
import useNodeTitle from '@cfViews/WorkflowView/GraphView/components/Section/Cell/CellNode/useNodeTitle'
import Tooltip from '@mui/material/Tooltip'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import * as Styled from '../styles'

const TableHeader = ({ table }: { table: OutcomeTable }) => {
  const { t } = useTranslation('workflow')
  const { contextLabel } = useReferenceLabels()

  const groups = table.groups.map((group, index) => {
    let groupTitle = ''
    if (table.groupedBy === 'context') {
      groupTitle = contextLabel(group.uuid)
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
      <Fragment key={group.uuid}>
        <Styled.HeaderLegendWrap role="group" aria-label={groupTitle}>
          <Styled.TableLegend>{groupTitle}</Styled.TableLegend>
        </Styled.HeaderLegendWrap>
        {groupNodes.map((nodeUuid) => {
          const node = table.entities.nodes[nodeUuid]
          const color = table.board.columns.colors[node.channelUuid ?? '']

          return <NodeHeader key={nodeUuid} node={node} color={color} />
        })}
      </Fragment>
    )
  })

  return (
    <Styled.TableHeader role="row">
      <Styled.HeaderLegendWrap aria-hidden />
      {groups}
    </Styled.TableHeader>
  )
}

const NodeHeader = ({
  node,
  color
}: {
  node: OutcomeTable['entities']['nodes'][string]
  color: string | undefined
}) => {
  const title = useNodeTitle(node)
  return (
    <Tooltip placement="top" arrow disableInteractive title={title}>
      <Styled.HeaderLegendWrap
        role="columnheader"
        aria-label={title}
        tabIndex={0}
      >
        <Styled.TableLegend color={color}>{title}</Styled.TableLegend>
      </Styled.HeaderLegendWrap>
    </Tooltip>
  )
}

export default TableHeader
