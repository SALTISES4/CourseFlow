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
  const groups = table.sections.map((section) => {
    const sectionDefaultTitle = t('systemLabels.sectionNumber', {
      number: (section.position ?? 0) + 1
    })

    const sectionTitle = displaySystemTitle(t, section, sectionDefaultTitle)

    return (
      <>
        <Styled.HeaderLegendWrap key={section.uuid}>
          <Styled.TableLegend>{sectionTitle}</Styled.TableLegend>
        </Styled.HeaderLegendWrap>
        {table.channels.map((chan) => (
          <Styled.HeaderLegendWrap key={chan.uuid}>
            <Styled.TableLegend color={chan.colour}>
              {displaySystemTitle(t, chan, t('graph.untitledNodeCategory'))}
            </Styled.TableLegend>
          </Styled.HeaderLegendWrap>
        ))}
      </>
    )
  })

  return groups
}

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
