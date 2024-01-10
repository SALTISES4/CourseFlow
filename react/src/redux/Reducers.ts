// @ts-nocheck
import * as Redux from 'redux'
import parentNodeReducer from '@cfRedux/reducers/parentNode'
import outcomeReducer from '@cfRedux/reducers/outcome'
import columnReducer from '@cfRedux/reducers/column'
import outcomeOutcomeReducer from '@cfRedux/reducers/outcomeOutcome'
import childWorkflowReducer from '@cfRedux/reducers/childWorkflow'
import outcomeNodeReducer from '@cfRedux/reducers/outcomeNode'
import nodeReducer from '@cfRedux/reducers/node'
import nodelinkReducer from '@cfRedux/reducers/nodelink'
import parentWorkflowReducer from '@cfRedux/reducers/parentWorfkflow'
import nodeweekReducer from '@cfRedux/reducers/nodeWeek'
import columnworkflowReducer from '@cfRedux/reducers/columnworkflow'
import strategyReducer from '@cfRedux/reducers/strategy'
import workflowReducer from '@cfRedux/reducers/workflow'
import outcomeworkflowReducer from '@cfRedux/reducers/outcomeWorkflow'
import outcomeHorizontalLinkReducer from '@cfRedux/reducers/outcomeHorizontalLink'
import objectSetReducer from '@cfRedux/reducers/objectSet'
import weekworkflowReducer from '@cfRedux/reducers/weekworkflow'
import weekReducer from '@cfRedux/reducers/week'

const rootWorkflowReducers = {
  workflow: workflowReducer,
  outcomeworkflow: outcomeworkflowReducer,
  columnworkflow: columnworkflowReducer,
  column: columnReducer,
  weekworkflow: weekworkflowReducer,
  week: weekReducer,
  nodeweek: nodeweekReducer,
  node: nodeReducer,
  nodelink: nodelinkReducer,
  outcome: outcomeReducer,
  outcomeoutcome: outcomeOutcomeReducer,
  outcomenode: outcomeNodeReducer,
  parent_workflow: parentWorkflowReducer,
  parent_node: parentNodeReducer,
  outcomehorizontallink: outcomeHorizontalLinkReducer,
  child_workflow: childWorkflowReducer,
  strategy: strategyReducer,
  objectset: objectSetReducer
}

const rootOutcomeReducers = {
  outcome: outcomeReducer,
  outcomeoutcome: outcomeOutcomeReducer
}

export const rootWorkflowReducer = Redux.combineReducers(rootWorkflowReducers)

export const rootOutcomeReducer = Redux.combineReducers(rootOutcomeReducers)
