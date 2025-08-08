import { type Instruction } from '@atlaskit/pragmatic-drag-and-drop-hitbox/list-item'
import { createSlice } from '@reduxjs/toolkit'
import { type PayloadAction } from '@reduxjs/toolkit'

// to keep track of newly created Outcome IDs
let dynamicID = 1

export type Outcome = {
  id: number
  title: string
  description?: string
  code?: string

  parent: number | null
  children?: number[]
  level: number
}

export type OutcomesState = {
  dragging: { id: number; level: number } | null
  outcomeOrder: number[]
  outcomeData: Record<number, Outcome>
}

const initialState: OutcomesState = {
  dragging: null,
  outcomeOrder: [],
  outcomeData: {}
}

// recursively go over the tree of outcomes and update ID to avoid collision
// function cloneOutcomeTree(outcome: Outcome) {
//   return {
//     ...outcome,
//     id: dynamicID++,
//     title: outcome.title + ' (duplicate)',
//     children: outcome.children.map(cloneOutcomeTree)
//   }
// }

type AddOutcomeType = Pick<Outcome, 'id'> &
  Partial<Outcome> & { order?: 'after' }

export const outcomesSlice = createSlice({
  name: 'outcomes',
  initialState,
  reducers: {
    // add new outcome group (at root level)
    addOutcomeGroup: (state, action: PayloadAction<string>) => {
      const outcomeId = dynamicID++
      state.outcomeOrder.push(outcomeId)
      state.outcomeData[outcomeId] = {
        id: outcomeId,
        title: action.payload,
        parent: null,
        children: [],
        level: 0
      }
    },

    // add outcome to a specific parent
    addOutcome: (state, action: PayloadAction<AddOutcomeType>) => {
      const outcomeId = dynamicID++
      const newOutcomeData: Outcome = {
        id: outcomeId,
        title: action.payload.title ?? 'Blank outcome title',
        description: action.payload.description ?? '',
        code: action.payload.code ?? '',
        children: action.payload.children ?? [],
        parent: -1, // added later
        level: 0 // added later
      }

      let orderAfterId = -1

      // if no "order", then we're simply appending to the parent ID
      if (!action.payload.order) {
        const parent = state.outcomeData[action.payload.id]
        newOutcomeData.parent = parent.id
        orderAfterId = parent.id // order after parent
        parent.children.push(outcomeId)
      } else {
        // if order is present, add after the target outcome
        const target = state.outcomeData[action.payload.id]
        newOutcomeData.parent = target.parent
        orderAfterId = target.id // order after target

        // update parent index
        const parent = state.outcomeData[target.parent]
        const childIndex = parent.children.indexOf(target.id)
        if (childIndex !== -1) {
          parent.children.splice(childIndex + 1, 0, outcomeId)
        }
      }

      // update the order index
      const orderIndex = state.outcomeOrder.indexOf(orderAfterId)
      if (orderIndex !== -1) {
        state.outcomeOrder.splice(orderIndex + 1, 0, outcomeId)
      }

      // set the correct level
      newOutcomeData.level = state.outcomeData[newOutcomeData.parent].level + 1

      // finally add the data itself
      state.outcomeData[outcomeId] = newOutcomeData
    },

    deleteOutcome: (state, action: PayloadAction<number>) => {
      const outcomeId = action.payload

      // delete from order
      const orderIndex = state.outcomeOrder.indexOf(outcomeId)
      state.outcomeOrder.splice(orderIndex, 1)

      // delete from parent
      const parentId = state.outcomeData[outcomeId].parent
      state.outcomeData[parentId].children.splice(
        state.outcomeData[parentId].children.indexOf(outcomeId),
        1
      )

      // finally, delete data
      delete state.outcomeData[outcomeId]
    },

    // duplicates the outcome below the target
    // cloning the tree structure as well
    duplicateOutcome: (state, action: PayloadAction<number>) => {
      // const pathToOutcome = findIndexPath(action.payload, state.groups)
      // const targetParent = findOutcome(pathToOutcome.slice(0, -1), state.groups)
      // const targetIndex = pathToOutcome.slice(-1)[0]
      // const clone = cloneOutcomeTree(targetParent.children[targetIndex])
      // targetParent.children.splice(targetIndex + 1, 0, clone)
    },

    // edit/update existing outcome with payload data
    updateOutcome: (state, action: PayloadAction<Outcome>) => {
      const outcome = state.outcomeData[action.payload.id]
      state.outcomeData[action.payload.id] = {
        ...outcome,
        ...action.payload
      }
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
      const target = state.outcomeData[targetId]
      const destination = state.outcomeData[destinationId]

      const targetIndex = state.outcomeOrder.indexOf(targetId)
      const destinationIndex = state.outcomeOrder.indexOf(destinationId)
      let orderId = destinationId // the id of the element around which we order
      let orderAfter = true // order after or before the orderId

      const combineMode = !operation || operation === 'combine'
      const reorderMode = !combineMode

      // combine mode means we're injecting outcome into a different parent
      if (combineMode) {
        // remove target from its parent
        const targetParent = state.outcomeData[target.parent]
        targetParent.children.splice(targetParent.children.indexOf(targetId), 1)

        // we're ordering after the last child of the parent, or parent if no children
        orderId = destination.children.length
          ? destination.children[destination.children.length - 1]
          : destination.id

        // finally push target onto the new parent's children
        destination.children.push(targetId)

        // and update target's parent
        target.parent = destination.id
      }

      // reorder mode is when we're moving outcome around adjacent outcomes
      // or reparenting it and reordering against same level outcomes
      if (reorderMode) {
        if (target.parent === destination.parent) {
          // early exit if the final positions wouldn't change at all
          if (
            operation === 'reorder-before' &&
            targetIndex < destinationIndex
          ) {
            return
          }

          if (operation === 'reorder-after' && targetIndex > destinationIndex) {
            return
          }

          // reorder outcomes
          const parent = state.outcomeData[target.parent]
          const { children } = parent
          children.splice(children.indexOf(targetId), 1)
          const destIndex = children.indexOf(destinationId)
          children.splice(
            operation === 'reorder-after' ? destIndex + 1 : destIndex,
            0,
            targetId
          )

          // order after or before the target?
          orderAfter = operation === 'reorder-after'
        } else {
          const oldParent = state.outcomeData[target.parent]
          const oldIndex = oldParent.children.indexOf(targetId)

          // remove from old parent
          oldParent.children.splice(oldIndex, 1)

          // add to new parent
          const newParent = state.outcomeData[destination.parent]
          const destIndex = newParent.children.indexOf(destinationId)
          newParent.children.splice(
            operation === 'reorder-after' ? destIndex + 1 : destIndex,
            0,
            targetId
          )

          // order after or before the target?
          orderAfter = operation === 'reorder-after'

          // set the correct parent
          target.parent = newParent.id
        }
      }

      // update final order
      state.outcomeOrder.splice(targetIndex, 1)
      const orderIndex = state.outcomeOrder.indexOf(orderId)
      state.outcomeOrder.splice(
        orderAfter ? orderIndex + 1 : orderIndex,
        0,
        targetId
      )
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
  duplicateOutcome,
  updateOutcome,
  moveOutcome,
  setDragging
} = outcomesSlice.actions
export default outcomesSlice.reducer
