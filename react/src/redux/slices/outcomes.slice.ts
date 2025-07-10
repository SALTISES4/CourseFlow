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
  editing: Outcome | null
  groups: Outcome[]
}

const initialState: OutcomesState = {
  editing: null,
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

export const outcomesSlice = createSlice({
  name: 'outcomes',
  initialState,
  reducers: {
    addOutcomeGroup: (state, action: PayloadAction<string>) => {
      state.groups.push({
        id: dynamicID++,
        title: action.payload,
        children: []
      })
    },
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
    }
  }
})

export const { addOutcomeGroup, addOutcome, updateOutcome } =
  outcomesSlice.actions
export default outcomesSlice.reducer
