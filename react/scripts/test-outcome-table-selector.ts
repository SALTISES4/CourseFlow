import assert from 'node:assert/strict'

import { configureStore } from '@reduxjs/toolkit'

import { graphStateReducer } from '../src/features/graph/state/graphState'
import type {
  ChannelEntity,
  NodeEntity,
  SectionEntity
} from '../src/features/graph/state/model/types'
import { selectOutcomeTable } from '../src/features/graph/state/selectors/outcomeTable.selectors'
import {
  channelsActions,
  nodesActions,
  sectionsActions
} from '../src/features/graph/state/slices/canonical'
import type { RootState } from '../src/redux/store'

const graphUuid = 'graph-1'
const sectionUuid = 'section-1'
const channelUuid = 'channel-1'
const nodeUuid = 'node-1'

const section: SectionEntity = {
  uuid: sectionUuid,
  graphUuid,
  title: '',
  titleCopyCount: 0,
  position: 0,
  threadUuid: null
}

const channel: ChannelEntity = {
  uuid: channelUuid,
  graphUuid,
  title: '',
  systemLabelCode: null,
  titleCopyCount: 0,
  colour: '',
  position: 0,
  threadUuid: null
}

const node: NodeEntity = {
  uuid: nodeUuid,
  nodeType: 'course',
  title: '',
  titleCopyCount: 0,
  description: '',
  contextClassification: null,
  taskClassification: null,
  timeRequired: 4,
  timeUnits: null,
  representsWorkflow: false,
  ponderationTheory: 1,
  ponderationPractice: 2,
  ponderationIndividual: 3,
  credits: 2,
  specificEducation: false,
  tagIds: [],
  graphUuid,
  sectionUuid,
  channelUuid,
  sectionRow: 0,
  workflowUuid: null,
  linkedWorkflowUuid: null,
  threadUuid: null,
  outcomeUuids: []
}

const store = configureStore({ reducer: { graph: graphStateReducer } })
store.dispatch(sectionsActions.upsertMany([section]))
store.dispatch(channelsActions.upsertMany([channel]))
store.dispatch(nodesActions.upsertMany([node]))

const firstTable = selectOutcomeTable(
  store.getState() as unknown as RootState,
  graphUuid
)
assert.strictEqual(
  selectOutcomeTable(store.getState() as unknown as RootState, graphUuid),
  firstTable
)
const firstCredits = firstTable.extraColumns.program.at(-1)
assert(firstCredits && 'values' in firstCredits)
assert.equal(firstCredits.values[nodeUuid], 2)
assert.equal(firstCredits.values[sectionUuid], 2)

store.dispatch(nodesActions.upsertMany([{ ...node, credits: 3 }]))

const secondTable = selectOutcomeTable(
  store.getState() as unknown as RootState,
  graphUuid
)
const secondCredits = secondTable.extraColumns.program.at(-1)
assert(secondCredits && 'values' in secondCredits)
assert.equal(secondCredits.values[nodeUuid], 3)
assert.equal(secondCredits.values[sectionUuid], 3)

// Recomputing the selector must not mutate a previously returned view model.
assert.equal(firstCredits.values[nodeUuid], 2)
assert.equal(firstCredits.values[sectionUuid], 2)

console.log('Outcome table selector accumulation is isolated.')
