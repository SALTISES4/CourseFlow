import { type Instruction } from '@atlaskit/pragmatic-drag-and-drop-hitbox/list-item'
import { createSlice, current as currentRTK } from '@reduxjs/toolkit'
import { type PayloadAction } from '@reduxjs/toolkit'

let dynamicID = 1

export type Outcome = {
  id: number
  title: string
  description?: string
  code?: string
  children?: Outcome[]
}

export type OutcomesState = {
  dragging: { id: number; level: number } | null
  groups: Outcome[]
}

const initialState: OutcomesState = {
  dragging: null,
  groups: []
}

// // DFS / depth first search shizzle
export function findIndexPath(
  needleId: number,
  haystack: Outcome[],
  path: number[] = []
): null | number[] {
  for (let i = 0; i < haystack.length; i++) {
    const currentPath = [...path, i]
    const pool = haystack[i]
    if (pool.id === needleId) {
      return currentPath
    }

    if (pool.children) {
      const found = findIndexPath(needleId, pool.children, currentPath)
      if (found) {
        return found
      }
    }
  }

  return null
}

function findOutcome(path: number[], state: Outcome[]) {
  if (path.length) {
    let current: Outcome[] | undefined = state
    for (let i = 0; i < path.length - 1; i++) {
      const index = path[i]
      current = current?.[index].children
    }
    const lastIndex = path[path.length - 1]
    if (current && current[lastIndex]) {
      return current[lastIndex]
    }
  }
}

export const outcomesSlice = createSlice({
  name: 'outcomes',
  initialState,
  reducers: {
    // add new outcome group (at root level)
    addOutcomeGroup: (state, action: PayloadAction<string>) => {
      state.groups.push({
        id: dynamicID++,
        title: action.payload,
        children: []
      })
    },

    // add outcome to a specific parent
    addOutcome: (
      state,
      action: PayloadAction<Outcome & { order?: 'after' }>
    ) => {
      const targetId = action.payload.id

      // if no "order", then we're simply appending to the parent ID
      if (!action.payload.order) {
        const pathToParent = findIndexPath(targetId, state.groups)
        const parent = findOutcome(pathToParent, state.groups)

        if (!parent.children) {
          parent.children = []
        }

        parent.children.push({
          id: dynamicID++,
          title: action.payload.title,
          description: action.payload.description ?? '',
          children: action.payload.children ?? []
        })
      } else {
        // otherwise, we're adding outcome after the target ID's index
        const pathToParent = findIndexPath(targetId, state.groups)
        const parent = findOutcome(pathToParent.slice(0, -1), state.groups)
        const targetIndex = pathToParent.slice(-1)[0]
        parent.children.splice(targetIndex + 1, 0, {
          id: dynamicID++,
          title: action.payload.title,
          description: action.payload.description ?? '',
          children: action.payload.children ?? []
        })
      }
    },

    deleteOutcome: (state, action: PayloadAction<number>) => {
      const pathToOutcome = findIndexPath(action.payload, state.groups)
      const targetParent = findOutcome(pathToOutcome.slice(0, -1), state.groups)
      const targetIndex = pathToOutcome.slice(-1)[0]
      targetParent.children.splice(targetIndex, 1)
    },

    // edit/update existing outcome with payload data
    updateOutcome: (state, action: PayloadAction<Outcome>) => {
      const pathToOutcome = findIndexPath(action.payload.id, state.groups)
      const targetParent = findOutcome(pathToOutcome.slice(0, -1), state.groups)
      const targetIndex = pathToOutcome.slice(-1)[0]
      targetParent.children[targetIndex] = action.payload
    },

    // move outcome within the outcome tree
    // optional operation param indicates reordering/combining action
    moveOutcome: (
      state,
      action: PayloadAction<{
        targetId: number
        destinationId: number
        operation?: Instruction['operation']
      }>
    ) => {
      const { targetId, destinationId, operation } = action.payload
      const destinationPath = findIndexPath(destinationId, state.groups)
      const targetPath = findIndexPath(targetId, state.groups)

      const targetIndex = targetPath.slice(-1)[0]
      const destinationIndex = destinationPath.slice(-1)[0]

      if (destinationPath.length && targetPath.length) {
        if (operation && operation !== 'combine') {
          // if the paths match, they belong to the same parent
          if (
            targetPath
              .slice(0, -1)
              .every((v, i) => v === destinationPath.slice(0, -1)[i])
          ) {
            // skip unnecessary reorders when positions wouldn't change
            if (
              operation === 'reorder-before' &&
              targetIndex < destinationIndex
            ) {
              return
            }

            if (
              operation === 'reorder-after' &&
              targetIndex > destinationIndex
            ) {
              return
            }

            const parent = findOutcome(targetPath.slice(0, -1), state.groups)
            const oldTarget = parent.children.splice(targetIndex, 1)
            parent.children.splice(
              operation === 'reorder-after'
                ? destinationIndex + 1
                : destinationIndex,
              0,
              oldTarget[0]
            )
          } else {
            const oldParent = findOutcome(targetPath.slice(0, -1), state.groups)
            const oldIndex = targetPath.slice(-1)[0]
            const elem = oldParent.children.splice(oldIndex, 1)
            const newParent = findOutcome(
              destinationPath.slice(0, -1),
              state.groups
            )

            newParent.children.splice(
              operation === 'reorder-after'
                ? destinationIndex + 1
                : destinationIndex,
              0,
              elem[0]
            )
          }
        } else {
          // if no operation is provided, we're just "reparenting" outcome
          // remove from old parent
          const oldParent = findOutcome(targetPath.slice(0, -1), state.groups)
          const oldIndex = targetPath.slice(-1)[0]
          const elem = oldParent.children.splice(oldIndex, 1)
          const newParent = findOutcome(destinationPath, state.groups)
          if (!newParent.children.length) {
            newParent.children = []
          }
          newParent.children.push(elem[0])
        }
      }
    },

    // set currently dragged outcome ID to better control pragmatic dropzones
    setDragging: (
      state,
      action: PayloadAction<{ id: number; level: number } | null>
    ) => {
      state.dragging = action.payload
    }
  }
})

export const {
  addOutcomeGroup,
  addOutcome,
  deleteOutcome,
  updateOutcome,
  moveOutcome,
  setDragging
} = outcomesSlice.actions
export default outcomesSlice.reducer
