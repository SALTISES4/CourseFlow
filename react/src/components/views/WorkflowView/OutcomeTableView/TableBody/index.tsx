import { OutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { displaySystemTitle } from '@cf/i18n/systemTitles'
import OutcomeHeader from '@cfPages/Workflow/Sidebar/components/OutcomesTab/Outcome/Header'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import Checkmark from '../Checkmark'
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
  const groups = table.sections.map((section) => {
    const sectionDefaultTitle = t('systemLabels.sectionNumber', {
      number: (section.position ?? 0) + 1
    })

    const sectionTitle = displaySystemTitle(t, section, sectionDefaultTitle)

    return (
      <>
        <Styled.BodyLegendWrap key={section.uuid}>
          <Styled.TableLegend>{sectionTitle}</Styled.TableLegend>
        </Styled.BodyLegendWrap>
        {table.channels.map((chan) => (
          <Styled.BodyLegendWrap key={chan.uuid}>
            <Styled.TableLegend color={chan.colour}>
              {displaySystemTitle(t, chan, t('graph.untitledNodeCategory'))}
            </Styled.TableLegend>
          </Styled.BodyLegendWrap>
        ))}
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
  // TODO: move this to a global state so it can be controlled from the outside
  const [collapsed, setCollapsed] = useState(true)
  const outcome = table.outcomeTree.outcomes[uuid]

  const onOutcomeToggleClick = () => setCollapsed(!collapsed)

  return (
    <>
      <Styled.BodyRow>
        <Styled.BodyLegendWrap>
          <OutcomeHeader
            uuid={uuid}
            level={outcome.level}
            title={outcome.title}
            collapsed={collapsed}
            showToggle={!!outcome.children.length}
            setCollapsed={() => {}} // this should be nuked really
            onToggleClick={onOutcomeToggleClick}
          />
        </Styled.BodyLegendWrap>

        <Styled.CheckmarkGroup className="Checkmarks-root">
          {table.sections.map((sec) => (
            <Styled.CheckmarkGroup key={sec.uuid}>
              <Checkmark
                readOnly
                sx={{ background: '#eef2fd' }}
                value={
                  ['empty', 'partial', 'full'][
                    Math.floor(Math.random() * 3)
                  ] as any
                }
              />
              {table.channels.map((chan) => (
                <Checkmark
                  key={chan.uuid}
                  value={
                    ['empty', 'partial', 'full'][
                      Math.floor(Math.random() * 3)
                    ] as any
                  }
                />
              ))}
            </Styled.CheckmarkGroup>
          ))}
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
