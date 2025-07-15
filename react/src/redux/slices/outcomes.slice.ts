import { createSlice } from '@reduxjs/toolkit'
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
    addOutcome: (state, action: PayloadAction<Outcome>) => {
      // payload id here is the id of the parent we want to add the outcome to
      const parentId = action.payload.id
      const pathToParent = findIndexPath(parentId, state.groups)
      if (pathToParent.length) {
        let current: Outcome[] | undefined = state.groups

        // loop down the path
        for (let i = 0; i < pathToParent.length - 1; i++) {
          const index = pathToParent[i]
          current = current?.[index].children
        }

        // ... and find the target parent we're injecting to
        const lastIndex = pathToParent[pathToParent.length - 1]
        const parent = current[lastIndex]

        if (!parent.children?.length) {
          parent.children = []
        }

        parent.children.push({
          id: dynamicID++,
          title: action.payload.title,
          description: action.payload.description ?? '',
          children: action.payload.children ?? []
        })
      }
    },

    // edit/update existing outcome with payload data
    updateOutcome: (state, action: PayloadAction<Outcome>) => {
      // find the path
      const pathToOutcome = findIndexPath(action.payload.id, state.groups)
      // drill to the correct outcome
      if (pathToOutcome.length) {
        let current: Outcome[] | undefined = state.groups
        for (let i = 0; i < pathToOutcome.length - 1; i++) {
          const index = pathToOutcome[i]
          current = current?.[index].children
        }
        const lastIndex = pathToOutcome[pathToOutcome.length - 1]
        // and update the target outcome
        if (current && current[lastIndex]) {
          current[lastIndex] = action.payload
        }
      }
    },

    // move outcome within the outcome tree
    moveOutcome: (
      state,
      action: PayloadAction<{ targetId: number; moveToId: number }>
    ) => {
      const { targetId, moveToId } = action.payload
      const newParentPath = findIndexPath(moveToId, state.groups)
      const targetPath = findIndexPath(targetId, state.groups)

      if (newParentPath.length && targetPath.length) {
        // remove from old parent
        const oldParent = findOutcome(
          targetPath.slice(0, targetPath.length - 1),
          state.groups
        )

        const oldIndex = oldParent.children?.findIndex((o) => o.id === targetId)

        if (oldIndex !== -1) {
          const elem = oldParent.children.splice(oldIndex, 1)
          const newParent = findOutcome(newParentPath, state.groups)
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
  updateOutcome,
  moveOutcome,
  setDragging
} = outcomesSlice.actions
export default outcomesSlice.reducer
