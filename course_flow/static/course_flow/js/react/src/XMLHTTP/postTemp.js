// REACT
import { renderMessageBox } from '../Components/components/MenuComponents/MenuComponents.js'
import { DATA_ACTIONS } from './common.js'

/**
 *
 */
function openLinkedWorkflowMenu(response, updateFunction) {
  if (response.action === DATA_ACTIONS.POSTED) {
    renderMessageBox(response, 'linked_workflow_menu', updateFunction)
  } else
    alert('Failed to find the parent project. Is this workflow in a project?')
}

function openAddedWorkflowMenu(response, updateFunction) {
  if (response.action === DATA_ACTIONS.POSTED) {
    renderMessageBox(response, 'added_workflow_menu', updateFunction)
  } else alert('Failed to find your workflows.')
}

function openWorkflowSelectMenu(response, updateFunction) {
  if (response.action === DATA_ACTIONS.POSTED) {
    renderMessageBox(response, 'workflow_select_menu', updateFunction)
  } else alert('Failed to find your workflows.')
}

function openTargetProjectMenu(response, updateFunction) {
  if (response.action === DATA_ACTIONS.POSTED) {
    renderMessageBox(response, 'target_project_menu', updateFunction)
  } else alert('Failed to find potential projects.')
}

//Get a list of possible workflows we can add to this project
export function getAddedWorkflowMenu(
  projectPk,
  type_filter,
  get_strategies,
  self_only,
  updateFunction
) {
  $.post(
    window.config.post_paths.get_possible_added_workflows,
    {
      projectPk: JSON.stringify(projectPk),
      type_filter: JSON.stringify(type_filter),
      get_strategies: JSON.stringify(get_strategies),
      self_only: JSON.stringify(self_only)
    },
    (data) => {
      // @TODO call to react render
      openAddedWorkflowMenu(data, updateFunction)
    }
  )
}

//Get the workflows that can be selected for the project, shaped for a menu
export function getWorkflowSelectMenu(
  projectPk,
  type_filter,
  get_strategies,
  self_only,
  updateFunction,
  receiptFunction
) {
  $.post(
    window.config.post_paths.get_possible_added_workflows,
    {
      projectPk: JSON.stringify(projectPk),
      type_filter: JSON.stringify(type_filter),
      get_strategies: JSON.stringify(get_strategies),
      self_only: JSON.stringify(self_only)
    },
    (data) => {
      // @TODO call to react render
      openWorkflowSelectMenu(data, updateFunction)
      if (receiptFunction) receiptFunction()
    }
  )
}

//Get possible projects that can be a target for the workflow to be duplicated into
export function getTargetProjectMenu(
  workflowPk,
  updateFunction,
  callBackFunction = () => console.log('success')
) {
  $.post(
    window.config.post_paths.get_target_projects,
    {
      workflowPk: JSON.stringify(workflowPk)
    },
    (data) => {
      callBackFunction()
      // @TODO call to react render
      openTargetProjectMenu(data, updateFunction)
    }
  )
}

//Get the list of workflows we can link to a node
export function getLinkedWorkflowMenu(
  nodeData,
  updateFunction,
  callBackFunction = () => console.log('success')
) {
  $.post(
    window.config.post_paths.get_possible_linked_workflows,
    {
      nodePk: JSON.stringify(nodeData.id)
    },
    (data) => {
      callBackFunction()
      // @TODO call to react render
      openLinkedWorkflowMenu(data, updateFunction)
    }
  )
}
