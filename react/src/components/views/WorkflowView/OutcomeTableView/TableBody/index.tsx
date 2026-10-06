import { OutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { displaySystemTitle } from '@cf/i18n/systemTitles'
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
        <Styled.BodyRow key={outcomeUuid}>
          <Styled.BodyLegendWrap>
            <Styled.TableLegend>
              {table.outcomes[outcomeUuid].title}
            </Styled.TableLegend>
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
      ))}
    </Styled.TagGroup>
  ))
}

export default OutcomeTableBody
