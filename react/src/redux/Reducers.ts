import outcomeReducer from '@cfRedux/reducers/outcome/outcome'
import outcomeHorizontalLinkReducer from '@cfRedux/reducers/outcome/outcomeHorizontalLink'
import outcomeNodeReducer from '@cfRedux/reducers/outcome/outcomeNode'
import outcomeOutcomeReducer from '@cfRedux/reducers/outcome/outcomeOutcome'
import outcomeworkflowReducer from '@cfRedux/reducers/outcome/outcomeWorkflow'
import sidebarReducer from '@cfRedux/reducers/sidebar/sidebar'
import childWorkflowReducer from '@cfRedux/reducers/workflow/childWorkflow'
import columnReducer from '@cfRedux/reducers/workflow/column'
import columnworkflowReducer from '@cfRedux/reducers/workflow/columnworkflow'
import nodeReducer from '@cfRedux/reducers/workflow/node'
import nodelinkReducer from '@cfRedux/reducers/workflow/nodelink'
import nodeweekReducer from '@cfRedux/reducers/workflow/nodeWeek'
import objectSetReducer from '@cfRedux/reducers/workflow/objectSet'
import parentNodeReducer from '@cfRedux/reducers/workflow/parentNode'
import parentProjectReducer from '@cfRedux/reducers/workflow/parentProject'
import parentWorkflowReducer from '@cfRedux/reducers/workflow/parentWorfkflow'
import strategyReducer from '@cfRedux/reducers/workflow/strategy'
import weekReducer from '@cfRedux/reducers/workflow/week'
import weekworkflowReducer from '@cfRedux/reducers/workflow/weekworkflow'
import workflowReducer from '@cfRedux/reducers/workflow/workflow'
import * as Redux from 'redux'

// @todo need to wrap these up

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
export const rootSidebarReducers = {
  sidebar: sidebarReducer
}
const rootOutcomeReducers = {
  outcome: outcomeReducer,
  outcomeoutcome: outcomeOutcomeReducer
}

export const rootWorkflowReducer = Redux.combineReducers(rootWorkflowReducers)

export const rootSidebarReducer = Redux.combineReducers(rootSidebarReducers)

export const rootOutcomeReducer = Redux.combineReducers(rootOutcomeReducers)
