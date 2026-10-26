import { nodeTitleFallback } from '@cf/components/pages/Workflow/Sidebar/components/EditTab/components/EditNode/linkedWorkflowUi'
import { selectOutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { displaySystemTitle } from '@cf/i18n/systemTitles'
import { RootState } from '@cf/redux/store'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import * as Styled from '../styles'

const TableHeader = ({ graphUuid }: { graphUuid: string }) => {
  const table = useSelector((state: RootState) =>
    selectOutcomeTable(state, graphUuid)
  )
  const { t } = useTranslation('workflow')
  const groups = table.entities.sections.map((section, index) => {
    const sectionDefaultTitle = t('systemLabels.sectionNumber', {
      number: (section.position ?? 0) + 1
    })

    const sectionTitle = displaySystemTitle(t, section, sectionDefaultTitle)
    const sectionNodes = table.sections[index].nodes.map((n) => n.uuid)

    return (
      <>
        <Styled.HeaderLegendWrap key={section.uuid}>
          <Styled.TableLegend>{sectionTitle}</Styled.TableLegend>
        </Styled.HeaderLegendWrap>
        {sectionNodes.map((nodeUuid) => {
          const node = table.entities.nodes[nodeUuid]
          const color = table.board.columns.colors[node.channelUuid ?? '']

          // TODO: handle title when it's coming from a linked workflow
          const displayTitle = node.linkedWorkflowUuid
            ? node.title || nodeTitleFallback(t('linked.untitledNode'))
            : displaySystemTitle(
                t,
                node,
                nodeTitleFallback(t('linked.untitledNode'))
              )

          return (
            <Styled.HeaderLegendWrap key={nodeUuid}>
              <Styled.TableLegend color={color}>
                {node.linkedWorkflowUuid
                  ? 'workflow - ' + node.linkedWorkflowUuid
                  : displayTitle}
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
