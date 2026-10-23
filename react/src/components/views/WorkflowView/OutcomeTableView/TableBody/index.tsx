import { nodeTitleFallback } from '@cf/components/pages/Workflow/Sidebar/components/EditTab/components/EditNode/linkedWorkflowUi'
import { OutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { outcomeTableUiActions } from '@cf/features/graph/state/slices/outcomeTableUi.slice'
import {
  linkNodeOutcome,
  unlinkNodeOutcome
} from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { displaySystemTitle } from '@cf/i18n/systemTitles'
import { AppDispatch, RootState } from '@cf/redux/store'
import OutcomeHeader from '@cfPages/Workflow/Sidebar/components/OutcomesTab/Outcome/Header'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import Checkmark, { OutcomeCheckmarkStatus } from '../Checkmark'
import * as Styled from '../styles'

type PropsType = {
  viewType: 'normal' | 'matrix'
  table: OutcomeTable
}

const OutcomeTableBody = ({ viewType, table }: PropsType) => {
  return (
    <Styled.TableBody>
      {viewType === 'normal' ? (
        <TagGroups table={table} />
      ) : (
        <SectionGroups table={table} />
      )}
    </Styled.TableBody>
  )
}

const SectionGroups = ({ table }: { table: OutcomeTable }) => {
  const { t } = useTranslation('workflow')
  const groups = table.entities.sections.map((section, index) => {
    const sectionDefaultTitle = t('systemLabels.sectionNumber', {
      number: (section.position ?? 0) + 1
    })

    const sectionTitle = displaySystemTitle(t, section, sectionDefaultTitle)
    const sectionNodes = table.sections[index].nodes.map((n) => n.uuid)

    return (
      <>
        <Styled.BodyRow>
          <Styled.BodyLegendWrap>
            <Styled.TableLegend>{sectionTitle}</Styled.TableLegend>
          </Styled.BodyLegendWrap>
        </Styled.BodyRow>
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
            <Styled.BodyLegendWrap key={nodeUuid}>
              <Styled.TableLegend color={color}>
                {node.linkedWorkflowUuid
                  ? 'workflow - ' + node.linkedWorkflowUuid
                  : displayTitle}
              </Styled.TableLegend>
            </Styled.BodyLegendWrap>
          )
        })}
      </>
    )
  })

  return groups
}

const TagGroups = ({ table }: { table: OutcomeTable }) => {
  return table.tagGroups.map((group) => (
    <Styled.TagGroup key={group.uuid}>
      <Styled.BodyRow className="Tagheader-root">
        <Styled.BodyLegendWrap>
          <Styled.TableLegend>
            {group.title || 'Untagged outcomes'}
          </Styled.TableLegend>
        </Styled.BodyLegendWrap>
        <Styled.BodyLegendWrap />
      </Styled.BodyRow>

      {group.outcomes.map((outcomeUuid) => (
        <TagGroupRow key={outcomeUuid} table={table} uuid={outcomeUuid} />
      ))}
    </Styled.TagGroup>
  ))
}

const TagGroupRow = ({
  table,
  uuid
}: {
  table: OutcomeTable
  uuid: string
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const expandedOutcomes = useSelector(
    (state: RootState) => state.graph.outcomeTableUi.expandedOutcomes
  )

  const outcome = table.outcomeTree.outcomes[uuid]
  const collapsed = !expandedOutcomes[uuid]

  const onOutcomeToggleClick = useCallback(() => {
    dispatch(outcomeTableUiActions.outcomeExpand({ uuid: uuid }))
  }, [dispatch, uuid])

  const onCheckmarkClick = (
    nodeUuid: string,
    status: OutcomeCheckmarkStatus
  ) => {
    return () => {
      // if the existing status is full, we're unlinking this and the children outcomes
      // otherwise, partial or empty will trigger the linking
      const action = status === 'full' ? 'unlink' : 'link'

      const params = {
        graphUuid: table.board.uuid,
        nodeUuid,
        outcomeUuid: outcome.uuid
      }

      dispatch(
        action === 'link' ? linkNodeOutcome(params) : unlinkNodeOutcome(params)
      )
    }
  }

  return (
    <>
      <Styled.BodyRow>
        <Styled.BodyLegendWrap>
          <OutcomeHeader
            uuid={uuid}
            level={outcome.level}
            title={outcome.title}
            tooltip={outcome.tooltipTitle}
            collapsed={collapsed}
            showToggle={!!outcome.children.length}
            setCollapsed={() => {}} // this should be nuked really
            onToggleClick={onOutcomeToggleClick}
          />
        </Styled.BodyLegendWrap>

        <Styled.CheckmarkGroup className="Checkmarks-root">
          {table.sections.map((section) => {
            return (
              <Styled.CheckmarkGroup key={section.uuid}>
                <Checkmark
                  readOnly
                  sx={{ background: '#eef2fd' }}
                  value={section.completion[outcome.uuid] ?? 'empty'}
                />
                {section.nodes.map((node) => {
                  const status = node.completion[outcome.uuid] ?? 'empty'
                  return (
                    <Checkmark
                      key={node.uuid}
                      value={status}
                      onClick={onCheckmarkClick(node.uuid, status)}
                    />
                  )
                })}
              </Styled.CheckmarkGroup>
            )
          })}
        </Styled.CheckmarkGroup>
      </Styled.BodyRow>
      {!collapsed &&
        outcome.children.map((childUuid) => (
          <TagGroupRow key={childUuid} table={table} uuid={childUuid} />
        ))}
    </>
  )
}

export default OutcomeTableBody
