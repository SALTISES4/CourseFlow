import { selectPendingOperations } from '@cf/features/graph/state/selectors/effectiveProjection.selectors'
import type { OutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import type { RootState } from '@cf/redux/store'
import { useSelector } from 'react-redux'

type OutcomeTree = OutcomeTable['outcomeTree']['outcomes']

export function affectedOutcomeUuids(
  outcomes: OutcomeTree,
  outcomeUuid: string
): string[] {
  const affected = new Set<string>()

  const addDescendants = (uuid: string) => {
    if (affected.has(uuid)) {
      return
    }
    affected.add(uuid)
    for (const childUuid of outcomes[uuid]?.children ?? []) {
      addDescendants(childUuid)
    }
  }

  addDescendants(outcomeUuid)
  let parentUuid = outcomes[outcomeUuid]?.parent
  while (parentUuid) {
    affected.add(parentUuid)
    parentUuid = outcomes[parentUuid]?.parent
  }

  return [...affected]
}

export function useOutcomeAssignmentPending(
  graphUuid: string,
  nodeUuid: string,
  outcomeUuid: string
): boolean {
  return useSelector((state: RootState) =>
    selectPendingOperations(state).some(
      (operation) =>
        operation.graphUuid === graphUuid &&
        operation.status === 'pending' &&
        (operation.type === 'linkNodeOutcome' ||
          operation.type === 'unlinkNodeOutcome') &&
        operation.payload.nodeUuid === nodeUuid &&
        operation.targetIds.includes(outcomeUuid)
    )
  )
}
