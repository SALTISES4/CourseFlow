import { nodeTitleFallback } from '@cf/components/pages/Workflow/Sidebar/components/EditTab/components/EditNode/linkedWorkflowUi'
import { getNodeOutcomeCompletionStatus } from '@cf/features/graph/state/selectors/outcomes.selectors'
import { OutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { displaySystemTitle } from '@cf/i18n/systemTitles'
import OutcomeHeader from '@cfPages/Workflow/Sidebar/components/OutcomesTab/Outcome/Header'
import { useState } from 'react'
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

const TagGroups = ({ table }: { table: OutcomeTable }) => {
  return table.tagGroups.map((group) => (
    <>
      <Styled.HeaderLegendWrap>
        <Styled.TableLegend>
          {group.title || 'Untagged outcomes'}
        </Styled.TableLegend>
      </Styled.HeaderLegendWrap>
      {group.outcomes.map((outcomeUuid) => (
        <TagGroupRow key={outcomeUuid} table={table} uuid={outcomeUuid} />
      ))}
    </>
  ))
}

const TagGroupRow = ({
  table,
  uuid
}: {
  table: OutcomeTable
  uuid: string
}) => {
  // TODO: move this to a global state so it can be controlled from the outside
  const [collapsed, setCollapsed] = useState(true)
  const outcome = table.outcomeTree.outcomes[uuid]

  const onOutcomeToggleClick = () => setCollapsed(!collapsed)

  return (
    <>
      <Styled.HeaderLegendWrap>
        <Styled.TableLegend sx={{ background: 'transparent', padding: 0 }}>
          <OutcomeHeader
            uuid={uuid}
            level={outcome.level}
            title={outcome.title}
            collapsed={collapsed}
            showToggle={!!outcome.children.length}
            setCollapsed={() => {}} // this should be nuked really
            onToggleClick={onOutcomeToggleClick}
          />
        </Styled.TableLegend>
      </Styled.HeaderLegendWrap>
      {!collapsed &&
        outcome.children.map((childUuid) => (
          <TagGroupRow key={childUuid} table={table} uuid={childUuid} />
        ))}
    </>
  )
}

export default OutcomeTableHeader
