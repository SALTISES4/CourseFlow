import { createSlice } from '@reduxjs/toolkit'
import { type PayloadAction } from '@reduxjs/toolkit'

export type Outcome = {
  id: number
  title: string
  children?: Outcome[]
}

const initialState: Outcome[] = []

// // DFS / depth first search shizzle
export function findIndexPath(
  needle: Outcome,
  haystack: Outcome[],
  path: number[] = []
): null | number[] {
  for (let i = 0; i < haystack.length; i++) {
    const currentPath = [...path, i]
    const pool = haystack[i]
    if (pool.id === needle.id) {
      return currentPath
    }

    if (pool.children) {
      const found = findIndexPath(needle, pool.children, currentPath)
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
    add: (
      state,
      action: PayloadAction<
        Outcome & {
          parent?: Outcome
        }
      >
    ) => {
      if (!action.payload.parent) {
        // without parent, we're working at the root level
        state.push(action.payload)
      } else {
        // otherwise, inject outcome into that parent Outcome
        const pathToOutcome = findIndexPath(action.payload.parent, state)

        if (pathToOutcome) {
          let current: Outcome[] | undefined = state

          // loop down the path
          for (let i = 0; i < pathToOutcome.length - 1; i++) {
            const index = pathToOutcome[i]
            current = current?.[index].children
          }

          // ... and find the target parent we're injecting to
          const lastIndex = pathToOutcome[pathToOutcome.length - 1]
          const parent = current[lastIndex]

          if (!parent.children) {
            parent.children = []
          }

          parent.children.push({
            id: action.payload.id,
            title: action.payload.title,
            children: action.payload.children ?? []
          })
        }
      }
    }
    // setEditing: (state, action: PayloadAction<Outcome | null>) => {
    //   state.editing = action.payload
    //   return state
    // },
    // saveEdit: (state, action: PayloadAction<Outcome>) => {
    //   const pathToOutcome = findIndexPath(action.payload, state.outcomes)
    //   if (pathToOutcome) {
    //     let current: Outcome[] | undefined = state.outcomes
    //     for (let i = 0; i < pathToOutcome.length - 1; i++) {
    //       const index = pathToOutcome[i]
    //       current = current?.[index].children
    //     }

    //     const lastIndex = pathToOutcome[pathToOutcome.length - 1]
    //     if (current && current[lastIndex]) {
    //       current[lastIndex] = action.payload
    //     }
    //   }

    //   state.editing = null
    //   return state
    // }
  }
})

export const { add: addOutcome } = outcomesSlice.actions
export default outcomesSlice.reducer
