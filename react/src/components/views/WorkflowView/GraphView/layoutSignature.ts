import type { GraphBoard } from '@cf/features/graph/state/selectors/graphBoard.selectors'

/**
 * Identifies changes that can move graph nodes without reacting to display-only
 * graph updates. The signature is intentionally based on identities and grid
 * placement rather than the selector's object references.
 */
export function createGraphLayoutSignature(board: GraphBoard): string {
  return JSON.stringify([
    board.uuid,
    board.columns.ids,
    board.sections.map((section) => [section.uuid, section.rows])
  ])
}
