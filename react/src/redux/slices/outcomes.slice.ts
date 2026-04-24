import { type Instruction } from '@atlaskit/pragmatic-drag-and-drop-hitbox/list-item'
import { getNextLargestNumber } from '@cf/redux/selectors/helpers'
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit'
import { type PayloadAction } from '@reduxjs/toolkit'

export type Outcome = {
  id: string
  title: string
  description?: string
  code?: string

  parent: string | null
  children?: string[]
  level: number
  linkedOutcomes?: string[]
  tags?: number[]
}

export const outcomeAdapter = createEntityAdapter<Outcome>()

export type OutcomesState = ReturnType<
  typeof outcomeAdapter.getInitialState
> & {
  dragging: { id: string; level: number } | null
  highlighted: number[]
}

const initialState: OutcomesState = {
  ...outcomeAdapter.getInitialState(),
  dragging: null,
  highlighted: []
}

type AddOutcomeType = Pick<Outcome, 'id'> &
  Partial<Outcome> & { order?: 'after' }

export const outcomesSlice = createSlice({
  name: 'outcomes',
  initialState,
  reducers: {
    // add outcome to a specific parent
    addOutcome: (state, action: PayloadAction<AddOutcomeType>) => {
      // const outcomeId = getNextLargestNumber(state.ids)
      // TODO: nope
      const outcomeId = 'new-outcome-id'

      const newOutcomeData: Outcome = {
        id: outcomeId,
        title: action.payload?.title ?? 'Blank outcome title',
        description: action.payload?.description ?? '',
        code: action.payload?.code ?? '',
        children: action.payload?.children ?? [],
        tags: action.payload?.tags ?? [],
        parent: null, // added later
        level: 0 // added later
      }

      // no payload, we're just creating new root level outcome
      if (!action.payload) {
        return outcomeAdapter.addOne(state, newOutcomeData)
      }

      // if no "order", then we're simply appending to the parent ID
      if (!action.payload.order) {
        const parent = state.entities[action.payload.id]
        newOutcomeData.parent = parent.id
        parent.children.push(outcomeId)
      } else {
        // if order is present, add after the target outcome
        const target = state.entities[action.payload.id]
        if (target.parent) {
          newOutcomeData.parent = target.parent
          const parent = state.entities[target.parent]
          const childIndex = parent.children.indexOf(target.id)
          if (childIndex !== -1) {
            parent.children.splice(childIndex + 1, 0, outcomeId)
          }
        }
      }

      // set the correct level
      newOutcomeData.level =
        newOutcomeData.parent === null
          ? 0
          : state.entities[newOutcomeData.parent].level + 1

      // finally add the data itself
      outcomeAdapter.addOne(state, newOutcomeData)

      // 4realfinally, move the newly added outcome to the correct position
      // but only if it's the root level outcome
      // can't do it earlier since RTK.addOne doesn't support rearranging
      if (action.payload.order && newOutcomeData.parent === null) {
        const index = state.ids.indexOf(newOutcomeData.id)
        const targetIndex = state.ids.indexOf(action.payload.id)
        state.ids.splice(index, 1)
        state.ids.splice(targetIndex + 1, 0, newOutcomeData.id)
      }
    },

    deleteOutcome: (state, action: PayloadAction<{ id: string }>) => {
      const outcomeId = action.payload.id

      // delete from parent
      const parentId = state.entities[outcomeId].parent
      if (parentId) {
        state.entities[parentId].children.splice(
          state.entities[parentId].children.indexOf(outcomeId),
          1
        )
      }

      outcomeAdapter.removeOne(state, outcomeId)
    },

    // duplicates the outcome below the target
    // cloning the tree structure as well
    duplicateOutcome: (state, action: PayloadAction<{ id: string }>) => {
      const target = state.entities[action.payload.id]
      const clonedIds: string[] = []

      // recursively go over the tree of outcomes and make updates
      function cloneOutcome(outcome: Outcome, parentId: string | null = null) {
        // const cloneId = getNextLargestNumber(state.ids)
        const cloneId = 'new-clone-id'
        clonedIds.push(cloneId)
        const clone = {
          ...outcome,
          id: cloneId,
          title: outcome.title + ' (duplicate)'
        }

        // set the correct parent and update the parent to also link to clone
        if (parentId) {
          clone.parent = parentId
          state.entities[parentId]?.children?.push(cloneId)
        }

        outcomeAdapter.addOne(state, clone)

        // iterate over children and do the whole dance over again
        const children = clone.children
        clone.children = [] // clear because they're being added in cloneOutcome
        children.map((c) => cloneOutcome(state.entities[c], cloneId))
      }

      // start from the target/root outcome
      cloneOutcome(target)

      // add the root clone to the correct parent
      if (target.parent) {
        const parent = state.entities[target.parent]
        const index = parent.children.indexOf(target.id)
        parent.children.splice(index + 1, 0, clonedIds[0])
      } else {
        // for the root level outcomes (without parent), rearrange ids
        const index = state.ids.indexOf(clonedIds[0])
        const targetIndex = state.ids.indexOf(target.id)
        state.ids.splice(index, 1)
        state.ids.splice(targetIndex + 1, 0, clonedIds[0])
      }
    },

    updateOutcome: (
      state,
      action: PayloadAction<{ id: string; data: Partial<Outcome> }>
    ) => {
      outcomeAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload.data
      })
    },

    // move outcome within the outcome tree
    // optional operation param indicates reordering/combining action
    moveOutcome: (
      state,
      action: PayloadAction<{
        targetId: string
        destinationId: string
        operation?: Instruction['operation']
      }>
    ) => {
      const { targetId, destinationId, operation } = action.payload
      const target = state.entities[targetId]
      const destination = state.entities[destinationId]
      const targetIndex = state.ids.indexOf(targetId)
      const destinationIndex = state.ids.indexOf(destinationId)
      let orderId = destinationId // the id of the element around which we order
      let orderAfter = true // order after or before the orderId
      const combineMode = !operation || operation === 'combine'
      const reorderMode = !combineMode

      // combine mode means we're injecting outcome into a different parent
      if (combineMode) {
        // remove target from its parent
        const targetParent = state.entities[target.parent]
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
            (operation === 'reorder-before' &&
              targetIndex < destinationIndex) ||
            (operation === 'reorder-after' && targetIndex > destinationIndex)
          ) {
            return
          }

          // reorder outcomes
          if (target.parent !== null) {
            const parent = state.entities[target.parent]
            const { children } = parent
            children.splice(children.indexOf(targetId), 1)
            const destIndex = children.indexOf(destinationId)
            children.splice(
              operation === 'reorder-after' ? destIndex + 1 : destIndex,
              0,
              targetId
            )
          }

          // order after or before the target?
          orderAfter = operation === 'reorder-after'
        } else {
          const oldParent = state.entities[target.parent]
          const oldIndex = oldParent.children.indexOf(targetId)

          // remove from old parent
          oldParent.children.splice(oldIndex, 1)

          // add to new parent
          const newParent = state.entities[destination.parent]
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
      state.ids.splice(targetIndex, 1)
      const orderIndex = state.ids.indexOf(orderId)
      state.ids.splice(orderAfter ? orderIndex + 1 : orderIndex, 0, targetId)
    },

    // set currently dragged outcome ID to better control pragmatic dropzones
    setDragging: (
      state,
      action: PayloadAction<{ id: string; level: number } | null>
    ) => {
      state.dragging = action.payload
    },

    // add/remove clicked outcome from being highlighted
    setHighlighted: (state, action: PayloadAction<number>) => {
      const id = action.payload
      const index = state.highlighted.indexOf(id)

      if (index === -1) {
        state.highlighted.push(id)
      } else {
        state.highlighted.splice(index, 1)
      }
    },

    // add/remove linked outcomes
    linkOutcome: (
      state,
      action: PayloadAction<{
        targetId: string
        destinationId: string
      }>
    ) => {
      const { targetId, destinationId } = action.payload
      const destination = state.entities[destinationId]
      if (!destination.linkedOutcomes) {
        destination.linkedOutcomes = [targetId]
      } else {
        const index = destination.linkedOutcomes?.indexOf(targetId)
        if (index !== -1) {
          destination.linkedOutcomes.splice(index, 1)
        } else {
          destination.linkedOutcomes.push(targetId)
        }
      }
    }
  }
})

export function isOutcomeLink(data: Record<string | symbol, unknown>): data is {
  id: string
  type: 'link_outcome'
} {
  return 'id' in data && 'type' in data && data.type === 'link_outcome'
}

export const {
  addOutcome,
  deleteOutcome,
  duplicateOutcome,
  updateOutcome,
  moveOutcome,
  linkOutcome,
  setDragging,
  setHighlighted
} = outcomesSlice.actions

export default outcomesSlice.reducer
