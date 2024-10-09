import childWorkflowReducer from '@cfRedux/reducers/childWorkflow'
import columnReducer from '@cfRedux/reducers/column'
import columnworkflowReducer from '@cfRedux/reducers/columnworkflow'
import nodeReducer from '@cfRedux/reducers/node'
import nodelinkReducer from '@cfRedux/reducers/nodelink'
import nodeweekReducer from '@cfRedux/reducers/nodeWeek'
import objectSetReducer from '@cfRedux/reducers/objectSet'
import outcomeReducer from '@cfRedux/reducers/outcome'
import outcomeHorizontalLinkReducer from '@cfRedux/reducers/outcomeHorizontalLink'
import outcomeNodeReducer from '@cfRedux/reducers/outcomeNode'
import outcomeOutcomeReducer from '@cfRedux/reducers/outcomeOutcome'
import outcomeworkflowReducer from '@cfRedux/reducers/outcomeWorkflow'
import parentNodeReducer from '@cfRedux/reducers/parentNode'
import parentProjectReducer from '@cfRedux/reducers/parentProject'
import parentWorkflowReducer from '@cfRedux/reducers/parentWorfkflow'
import strategyReducer from '@cfRedux/reducers/strategy'
import weekReducer from '@cfRedux/reducers/week'
import weekworkflowReducer from '@cfRedux/reducers/weekworkflow'
import workflowReducer from '@cfRedux/reducers/workflow'
import * as Redux from 'redux'

export const rootWorkflowReducers = {
  workflow: workflowReducer,
  columnworkflow: columnworkflowReducer,
  column: columnReducer,
  weekworkflow: weekworkflowReducer,
  week: weekReducer,
  node: nodeReducer,
  nodelink: nodelinkReducer,
  nodeweek: nodeweekReducer,
  outcome: outcomeReducer,
  outcomenode: outcomeNodeReducer,
  outcomeworkflow: outcomeworkflowReducer,
  outcomeoutcome: outcomeOutcomeReducer,
  outcomehorizontallink: outcomeHorizontalLinkReducer,
  parentWorkflow: parentWorkflowReducer,
  parentNode: parentNodeReducer,
  child_workflow: childWorkflowReducer,
  parentProject: parentProjectReducer,
  strategy: strategyReducer,
  objectset: objectSetReducer
}

const rootOutcomeReducers = {
  outcome: outcomeReducer,
  outcomeoutcome: outcomeOutcomeReducer
}

export const rootWorkflowReducer = Redux.combineReducers(rootWorkflowReducers)

export const rootOutcomeReducer = Redux.combineReducers(rootOutcomeReducers)
