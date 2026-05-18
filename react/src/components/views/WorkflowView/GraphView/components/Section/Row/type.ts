import { GraphBoard } from '@cf/features/graph/state/selectors/graphBoard.selectors'
import { SectionPropsType } from '@cfViews/WorkflowView/GraphView/components/Section'
import { MouseEvent } from 'react'

interface NonEmptyRowType {
  nodes: GraphBoard['sections'][0]['rows'][0]
  graphUuid: string
  sectionId: string
  rowIndex: number
  columnIds: GraphBoard['columns']['ids']
  columnColors: GraphBoard['columns']['colors']
  onNodeDrop: SectionPropsType['onNodeDrop']
  onNodeClick: (e: MouseEvent<HTMLDivElement>, nodeuuid: string) => void
}

interface EmptyRowType
  extends Pick<
    NonEmptyRowType,
    'graphUuid' | 'sectionId' | 'columnIds' | 'columnColors' | 'onNodeDrop'
  > {
  rowIndex: 'empty'
}

export type SectionRowPropsType = EmptyRowType | NonEmptyRowType
