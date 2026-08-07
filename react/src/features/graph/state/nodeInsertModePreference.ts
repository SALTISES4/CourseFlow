import type { NodeInsertMode } from './resolveNodeDropRow'

export const DEFAULT_NODE_INSERT_MODE: NodeInsertMode = 'row'

const STORAGE_KEY_PREFIX = 'courseflow:workflow-node-insert-mode'

const isNodeInsertMode = (value: string | null): value is NodeInsertMode =>
  value === 'manual' || value === 'row' || value === 'column'

const preferenceKey = (userUuid: string, workflowUuid: string) =>
  `${STORAGE_KEY_PREFIX}:${userUuid}:${workflowUuid}`

export const loadNodeInsertModePreference = (
  userUuid: string,
  workflowUuid: string
): NodeInsertMode => {
  try {
    const storedMode = localStorage.getItem(
      preferenceKey(userUuid, workflowUuid)
    )
    return isNodeInsertMode(storedMode) ? storedMode : DEFAULT_NODE_INSERT_MODE
  } catch {
    return DEFAULT_NODE_INSERT_MODE
  }
}

export const saveNodeInsertModePreference = (
  userUuid: string,
  workflowUuid: string,
  mode: NodeInsertMode
) => {
  try {
    localStorage.setItem(preferenceKey(userUuid, workflowUuid), mode)
  } catch {
    // Storage can be unavailable; the active Redux state still remains usable.
  }
}
