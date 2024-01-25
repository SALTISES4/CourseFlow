import { EmptyPostResp, AddTerminologyQueryResp } from '@XMLHTTP/types/query'
import { VERB } from '@cfModule/types/enum'

//Add a new node to a week
export function newNodeQuery(
  weekPk,
  position = -1,
  column = -1,
  column_type = -1,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.new_node, {
      weekPk: JSON.stringify(weekPk),
      position: JSON.stringify(position),
      columnPk: JSON.stringify(column),
      columnType: JSON.stringify(column_type)
    }).done(function (data: EmptyPostResp) {
      if (data.action === VERB.POSTED) {
        callBackFunction(data)
      } else {
        window.fail_function(data.action)
      }
    })
  } catch (err) {
    window.fail_function()
  }
}

/**
 * @newOutcome
 *
 * Add a new outcome to a workflow
 *
 * endpoint: workflow/outcome/new
 *
 * @param workflowPk
 * @param object_set_id
 * @param callBackFunction
 */
export function newOutcomeQuery(
  workflowPk: number,
  object_set_id: number,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.new_outcome, {
      workflowPk: JSON.stringify(workflowPk),
      objectsetPk: JSON.stringify(object_set_id)
    }).done(function (data: EmptyPostResp) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Add a strategy to the workflow
export function addStrategyQuery(
  workflowPk: number,
  position = -1,
  strategyPk = -1,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.add_strategy, {
      workflowPk: JSON.stringify(workflowPk),
      position: JSON.stringify(position),
      objectID: JSON.stringify(strategyPk),
      objectType: JSON.stringify('workflow')
    }).done(function (data: EmptyPostResp) {
      if (data.action === VERB.POSTED) {
        callBackFunction(data)
      } else {
        window.fail_function(data.action)
      }
    })
  } catch (err) {
    window.fail_function()
  }
}

export function newNodeLink(
  source_node,
  target_node,
  source_port,
  target_port,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.new_node_link, {
      nodePk: JSON.stringify(source_node),
      objectID: JSON.stringify(target_node),
      objectType: JSON.stringify('node'),
      sourcePort: JSON.stringify(source_port),
      targetPort: JSON.stringify(target_port)
    }).done(function (data: EmptyPostResp) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Causes the specified object to insert a child to itself
export function insertChildQuery(
  objectID: number,
  objectType: any,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.insert_child, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType)
    }).done(function (data: EmptyPostResp) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Causes the specified object to insert a sibling after itself
export function insertSiblingQuery(
  objectID: number,
  objectType: any,
  parentID: number,
  parentType: any,
  throughType: any,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.insert_sibling, {
      parentID: JSON.stringify(parentID),
      parentType: JSON.stringify(parentType),
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      throughType: JSON.stringify(throughType)
    }).done(function (data: EmptyPostResp) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

/**
 * Add an object set to a project
 *
 * @param projectPk
 * @param term
 * @param title
 * @param translation_plural
 * @param callBackFunction
 */
export function addTerminologyQuery(
  projectPk: number,
  term: any,
  title: any,
  translation_plural: any,
  callBackFunction = (_data: AddTerminologyQueryResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.add_terminology, {
      projectPk: JSON.stringify(projectPk),
      term: JSON.stringify(term),
      title: JSON.stringify(title),
      translation_plural: JSON.stringify(translation_plural)
    }).done(function (data: AddTerminologyQueryResp) {
      console.log('addTerminologyQuery query')
      console.log(data)
      if (data.action === VERB.POSTED) {
        callBackFunction(data)
      } else {
        window.fail_function(data.action)
      }
    })
  } catch (err) {
    window.fail_function()
  }
}
