import assert from 'node:assert/strict'

import { configureStore } from '@reduxjs/toolkit'

import {
  formatDurationHours,
  formatDurationHoursNumber,
  formatDurationInput,
  parseDurationInput
} from '../src/components/common/duration'
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
  timeRequiredMinutes: 240,
  representsWorkflow: false,
  ponderationTheoryMinutes: 60,
  ponderationPracticeMinutes: 120,
  ponderationIndividualMinutes: 180,
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
const firstDuration = firstTable.extraColumns.course[0]
assert(firstDuration && 'values' in firstDuration)
assert.equal(firstDuration.values[nodeUuid], 240)
assert.equal(firstDuration.values[sectionUuid], 240)

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

store.dispatch(
  nodesActions.upsertMany([
    {
      ...node,
      timeRequiredMinutes: null,
      ponderationTheoryMinutes: null,
      ponderationPracticeMinutes: null,
      ponderationIndividualMinutes: null,
      credits: null
    }
  ])
)
const nullTable = selectOutcomeTable(
  store.getState() as unknown as RootState,
  graphUuid
)
const nullDuration = nullTable.extraColumns.course[0]
assert(nullDuration && 'values' in nullDuration)
assert.equal(nullDuration.values[nodeUuid], null)
assert.equal(nullDuration.values[sectionUuid], null)
const nullCredits = nullTable.extraColumns.program.at(-1)
assert(nullCredits && 'values' in nullCredits)
assert.equal(nullCredits.values[nodeUuid], null)
assert.equal(nullCredits.values[sectionUuid], null)

store.dispatch(
  nodesActions.upsertMany([
    {
      ...node,
      timeRequiredMinutes: 0,
      ponderationTheoryMinutes: 0,
      ponderationPracticeMinutes: 0,
      ponderationIndividualMinutes: 0,
      credits: 0
    }
  ])
)
const zeroTable = selectOutcomeTable(
  store.getState() as unknown as RootState,
  graphUuid
)
const zeroDuration = zeroTable.extraColumns.course[0]
assert(zeroDuration && 'values' in zeroDuration)
assert.equal(zeroDuration.values[nodeUuid], 0)
assert.equal(zeroDuration.values[sectionUuid], 0)
const zeroCredits = zeroTable.extraColumns.program.at(-1)
assert(zeroCredits && 'values' in zeroCredits)
assert.equal(zeroCredits.values[nodeUuid], 0)
assert.equal(zeroCredits.values[sectionUuid], 0)

assert.deepEqual(parseDurationInput('12345'), {
  valid: true,
  value: 7425
})
assert.deepEqual(parseDurationInput('12360'), {
  valid: false,
  value: null
})
assert.deepEqual(parseDurationInput(''), { valid: true, value: null })
assert.equal(formatDurationInput(7425), '12345')
assert.equal(formatDurationHoursNumber(10, 'en-CA'), '0.2')
assert.equal(formatDurationHoursNumber(60, 'en-CA'), '1.0')
assert.equal(formatDurationHours(60, 'en-CA'), '1.0 hours')
assert.equal(formatDurationHours(null, 'en-CA'), '')

console.log('Outcome table selector accumulation is isolated.')
