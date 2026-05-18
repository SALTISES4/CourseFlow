/**
 * Builds the Workflow graph “board” view model from canonical graph Redux state.
 *
 * Keeps parity with legacy `workflow.selector` shape; color derivation stays here
 * (canonical `ChannelEntity` has no legacy column-type/theme fields).
 */

import { defaultColumnSettings } from '@cf/utility/constants'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { createSelector, lruMemoize } from 'reselect'

import type { GraphState } from '../graphState'
import {
  selectChannelsOrderedByGraphUuid,
  selectNodesByGraphUuid,
  selectSectionsOrderedByGraphUuid
} from './canonical.selectors'
import type { GraphUuid, NodeEntity } from '../model/types'

type StateWithGraph = {
  graph: GraphState
}

type SectionBoard = {
  uuid: string
  rows: Record<string, string>[]
}

export type GraphBoard = {
  uuid: string
  columns: {
    ids: string[]
    colors: Record<string, string>
  }
  sections: SectionBoard[]
}

// SECTION ROW EXAMPLE
// this section has 3 rows       rows = [
// #11 x: 3, y: 0               { 3: 11 },
// #22 x: 2, y: 1               { 2: 22, 3: 23 },
// #23 x: 3, y: 1               { 0: 33 }
// #33 x: 0, y: 2             ]

const CYCLIC_DEFAULT_COLUMN_TYPES: number[] = Object.keys(defaultColumnSettings)
  .filter((key) => typeof key !== 'symbol' && key !== 'new-column')
  .map(Number)
  .filter((n) => !Number.isNaN(n))
  .sort((a, b) => a - b)

const emptyBoard = (graphUuid: string): GraphBoard => ({
  uuid: graphUuid,
  columns: { ids: [], colors: {} },
  sections: []
})

const buildChannelColors = (
  channelUuids: string[]
): GraphBoard['columns']['colors'] => {
  const colors: GraphBoard['columns']['colors'] = {}
  const types = CYCLIC_DEFAULT_COLUMN_TYPES
  const typeCount = types.length > 0 ? types.length : 1

  channelUuids.forEach((uuid, idx) => {
    const columnType = types.length > 0 ? types[idx % typeCount] : 0
    colors[uuid] = ThemeHelper.getColumnColour({
      columnType,
      colour: null
    })
  })

  return colors
}

/**
 * Memoized selector factory keyed by graph UUID.
 * Use: `selectGraphBoard(state, graphUuid)`.
 */
const makeSelectGraphBoard = lruMemoize(
  (graphUuid: GraphUuid) =>
    createSelector(
      [
        selectSectionsOrderedByGraphUuid(graphUuid),
        selectChannelsOrderedByGraphUuid(graphUuid),
        selectNodesByGraphUuid(graphUuid)
      ],
      (orderedSections, orderedChannels, workflowNodes): GraphBoard => {
        const columnIds = orderedChannels.map((c) => c.uuid)
        const columnIndexMap = new Map<string, number>()
        columnIds.forEach((id, idx) => {
          columnIndexMap.set(id, idx)
        })

        const colors = buildChannelColors(columnIds)

        const sections: SectionBoard[] = orderedSections.map((section) => {
          const rows: SectionBoard['rows'] = []
          const sectionNodes = workflowNodes.filter(
            (n) => n.sectionUuid === section.uuid
          )

          sectionNodes
            .sort((a, b) => {
              const rowA = a.sectionRow ?? 0
              const rowB = b.sectionRow ?? 0
              if (rowA !== rowB) {
                return rowA - rowB
              }
              const colA = columnIndexMap.get(a.channelUuid ?? '') ?? 999
              const colB = columnIndexMap.get(b.channelUuid ?? '') ?? 999
              return colA - colB
            })
            .forEach((node) =>
              placeNodeOnBoard(node, rows, columnIndexMap, section.uuid)
            )

          return {
            uuid: section.uuid,
            rows
          }
        })

        return {
          uuid: graphUuid,
          columns: {
            ids: columnIds,
            colors
          },
          sections
        }
      }
    ),
  { maxSize: 32 }
)

function placeNodeOnBoard(
  node: NodeEntity,
  rows: SectionBoard['rows'],
  columnIndexMap: Map<string, number>,
  sectionUuid: string
) {
  if (node.channelUuid == null) {
    return
  }
  const x = columnIndexMap.get(node.channelUuid)
  if (x === undefined) {
    return
  }
  const y = node.sectionRow ?? 0

  if (!rows[y]) {
    rows[y] = { [x]: node.uuid }
  } else {
    if (rows[y][x]) {
      console.warn(
        `node overwrite at section #${sectionUuid} ${y}/${x} node id #${node.uuid} replacing #${rows[y][x]}`
      )
    }
    rows[y][x] = node.uuid
  }
}

export function selectGraphBoard(
  state: StateWithGraph,
  graphUuid: GraphUuid | ''
): GraphBoard {
  if (!graphUuid) {
    return emptyBoard('')
  }
  return makeSelectGraphBoard(graphUuid)(state)
}
