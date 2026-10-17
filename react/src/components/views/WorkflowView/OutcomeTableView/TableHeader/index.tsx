import { nodeTitleFallback } from '@cf/components/pages/Workflow/Sidebar/components/EditTab/components/EditNode/linkedWorkflowUi'
import { OutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { displaySystemTitle } from '@cf/i18n/systemTitles'
import { useTranslation } from 'react-i18next'

import * as Styled from '../styles'

type PropsType = {
  viewType: 'normal' | 'matrix'
  table: OutcomeTable
}

const OutcomeTableHeader = ({ viewType, table }: PropsType) => {
  return (
    <Styled.TableHeader>
      <Styled.HeaderLegendWrap></Styled.HeaderLegendWrap>
      {viewType === 'normal' ? (
        <SectionGroups table={table} />
      ) : (
        <TagGroups table={table} />
      )}
    </Styled.TableHeader>
  )
}

const SectionGroups = ({ table }: { table: OutcomeTable }) => {
  const { t } = useTranslation('workflow')
  const groups = table.entities.sections.map((section, index) => {
    const sectionDefaultTitle = t('systemLabels.sectionNumber', {
      number: (section.position ?? 0) + 1
    })

    const sectionTitle = displaySystemTitle(t, section, sectionDefaultTitle)

    // TODO: move this to a selecto preferably
    // grab all node UUIDs for this section, ordered
    const sectionNodes = table.board.sections[index].rows.reduce<string[]>(
      (acc, row) => {
        const keys = Object.keys(row).sort((a, b) => a.localeCompare(b))
        const rowUuids = keys.map((key) => row[key])
        return [...acc, ...rowUuids]
      },
      []
    )

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

  return groups
}

// TODO: implement
const TagGroups = ({ table }: { table: OutcomeTable }) => {
  return (
    <>
      <Styled.HeaderLegendWrap>
        <Styled.TableLegend>Hello</Styled.TableLegend>
      </Styled.HeaderLegendWrap>
      <Styled.HeaderLegendWrap>
        <Styled.TableLegend>From</Styled.TableLegend>
      </Styled.HeaderLegendWrap>
      <Styled.HeaderLegendWrap>
        <Styled.TableLegend>Outcome tag</Styled.TableLegend>
      </Styled.HeaderLegendWrap>
    </>
  )
}

export default OutcomeTableHeader
