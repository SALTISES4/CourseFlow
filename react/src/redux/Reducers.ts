import outcomeReducer from '@cfRedux/reducers/outcome/outcome'
import outcomeHorizontalLinkReducer from '@cfRedux/reducers/outcome/outcomeHorizontalLink'
import outcomeNodeReducer from '@cfRedux/reducers/outcome/outcomeNode'
import outcomeOutcomeReducer from '@cfRedux/reducers/outcome/outcomeOutcome'
import outcomeworkflowReducer from '@cfRedux/reducers/outcome/outcomeWorkflow'
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
import weekworkflowReducer from '@cfRedux/reducers/workflow/weekworkflow'
import workflowReducer from '@cfRedux/reducers/workflow/workflow'
import nodeSliceReducer from '@cfRedux/slices/node.slice'
import sidebarReducer from '@cfRedux/slices/sidebar.slice'
import weekReducer from '@cfRedux/slices/week.slice'
import * as Redux from 'redux'

// @todo need to wrap these up

/*******************************************************
 * Previous developers have implemented user message author filtering
 *  - on client side (as there are not channels / groups per user)
 *  - only on SOME actions
 *  - these action revolve around the 'CHANGE_FIELD' action type for
 *   different domains/entities
 *
 *   OutcomeActions.CHANGE_FIELD:
 *   OutcomeBaseActions.CHANGE_FIELD:
 *   OutcomeActions.changeField_MANY:
 *   OutcomeBaseActions.changeField_MANY:
 *   ColumnActions.CHANGE_FIELD:
 *   NodeLinkActions.CHANGE_FIELD
 *   WorkflowActions.CHANGE_FIELD:
 *   WorkflowActions.CHANGE_FIELD
 *   NodeActions.CHANGE_FIELD
 *
 *   These actions follow a predictable pattern
 *   it is moved to filter on user id to make it more standard
 *   it follows the generic patterns of
 *     - UI updates
 *     - UI calls dispatch
 *     - UI makes REST call
 *     - Socket server emits similar redux call (i.e. a group update)
 *     - local client filters on user publisher ID
 *     - note this filter is now moved out of redux and will happen close to the socket connection
 *
 *    TBD: why are these the only websocket calls being filtered?
 *
 *
 *******************************************************/

export const rootWorkflowReducers = {
  // to remove
  nodeweek: nodeweekReducer,
  columnworkflow: columnworkflowReducer,
  weekworkflow: weekworkflowReducer,
  outcomeworkflow: outcomeworkflowReducer,
  outcomenode: outcomeNodeReducer,
  outcomeoutcome: outcomeOutcomeReducer,

  // keep these flat/normalized first order entities
  workflow: workflowReducer,
  column: columnReducer,
  week: weekReducer,
  node: nodeReducer,
  // note this is not called nodenode, although that's what it is
  //  a n2M with UI applications
  nodelink: nodelinkReducer,
  outcome: outcomeReducer,
  // verify
  objectset: objectSetReducer,
  outcomehorizontallink: outcomeHorizontalLinkReducer,
  strategy: strategyReducer,

  // @todo sort through these parent / children, why do they need to be in store
  parentWorkflow: parentWorkflowReducer,
  parentNode: parentNodeReducer,
  parentProject: parentProjectReducer,
  childWorkflow: childWorkflowReducer
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
