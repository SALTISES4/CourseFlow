import {
  AddTerminologyQueryResp,
  DuplicateBaseItemQueryResp,
  InsertChildQueryResp,
  InsertSiblingQueryResp,
  UpdateValueInstantQueryResp
} from '@XMLHTTP/types'
import {ToDefine, VERB} from '@cfModule/types/common'
import {OBJECT_TYPE} from "@cfModule/types/enum";

/**
 *
 * @duplicateBaseItemQuery
 *
 *
 *
 * Duplicate a project workflow, strategy, or outcome
 *
 * @param itemPk
 * @param objectType
 * @param projectID
 * @param callBackFunction
 */
export function duplicateBaseItemQuery(
  itemPk: number,
  objectType: string,
  projectID: number,
  callBackFunction = (_data: DuplicateBaseItemQueryResp) =>
    console.log('success')
) {
  const sendPostRequest = (url, data) => {
    $.post(url, data).done(function (response: DuplicateBaseItemQueryResp) {
      console.log('duplicateBaseItemQuery response')
      console.log(response)

      if (response.action === VERB.POSTED) {
        callBackFunction(response)
      } else {
        window.fail_function(response.action)
      }
    })
  }

  try {
    const itemPkString = JSON.stringify(itemPk)
    const projectPkString = JSON.stringify(projectID)

    if (objectType === OBJECT_TYPE.PROJECT) {
      sendPostRequest(COURSEFLOW_APP.config.post_paths.duplicate_project_ajax, {
        projectPk: itemPkString
      })
    } else if (objectType === OBJECT_TYPE.OUTCOME) {
      sendPostRequest(COURSEFLOW_APP.config.post_paths.duplicate_outcome_ajax, {
        outcomePk: itemPkString,
        projectPk: projectPkString
      })
    } else if (objectType === OBJECT_TYPE.STRATEGY) {
      sendPostRequest(
        COURSEFLOW_APP.config.post_paths.duplicate_strategy_ajax,
        { workflowPk: itemPkString }
      )
    } else {
      sendPostRequest(
        COURSEFLOW_APP.config.post_paths.duplicate_workflow_ajax,
        { workflowPk: itemPkString, projectPk: projectPkString }
      )
    }
  } catch (err) {
    window.fail_function()
  }
}

/*******************************************************
 * UPDATE
 *******************************************************/

//
/**
 * @updateValue
 * Update the value of an object in database. JSON may be partial. Debounced in case the user is typing a lot.
 *
 * endpoint: workflow/updatevalue/
 *
 * @param objectID
 * @param objectType
 * @param json
 * @param changeField
 * @param callBackFunction
 */
export function updateValueQuery(
  objectID: number,
  objectType: any,
  json: any,
  changeField = false,
  callBackFunction = () => console.log('success')
) {
  const t = 1000
  const previousCall = document.lastUpdateCall

  document.lastUpdateCall = {
    time: Date.now(),
    id: objectID,
    type: objectType,
    field: Object.keys(json)[0]
  }

  if (previousCall && document.lastUpdateCall.time - previousCall.time <= t) {
    clearTimeout(document.lastUpdateCallTimer)
  }
  if (
    previousCall &&
    (previousCall.id !== document.lastUpdateCall.id ||
      previousCall.type !== document.lastUpdateCall.type ||
      previousCall.field !== document.lastUpdateCall.field)
  ) {
    document.lastUpdateCallFunction()
  }
  const post_object = {
    objectID: JSON.stringify(objectID),
    objectType: JSON.stringify(objectType),
    data: JSON.stringify(json),
    changeFieldID: 0
  }

  if (changeField) {
    // @ts-ignore
    post_object.changeFieldID = // @ts-ignore
      COURSEFLOW_APP.contextData.changeFieldID as number
  }

  document.lastUpdateCallFunction = () => {
    try {
      $.post(COURSEFLOW_APP.config.post_paths.update_value, post_object).done(
        function (data) {
          // @ts-ignore
          if (data.action === VERB.POSTED) {
            // @ts-ignore
            callBackFunction(_data)
          } else window.fail_function(data.action)
        }
      )
    } catch (err) {
      window.fail_function()
    }
  }
  document.lastUpdateCallTimer = setTimeout(document.lastUpdateCallFunction, t)
}

//As above, but not debounced
export function updateValueInstantQuery(
  objectID: number,
  objectType: any,
  json: any,
  callBackFunction = (_data: UpdateValueInstantQueryResp) =>
    console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.update_value, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      data: JSON.stringify(json)
    }).done(function (data: UpdateValueInstantQueryResp) {
      // @ts-ignore
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

/**
 * Add a comment to an object
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

//Causes the specified object to insert a sibling after itself
export function insertSiblingQuery(
  objectID: number,
  objectType: any,
  parentID: number,
  parentType: any,
  throughType: any,
  callBackFunction = (_data: InsertSiblingQueryResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.insert_sibling, {
      parentID: JSON.stringify(parentID),
      parentType: JSON.stringify(parentType),
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      throughType: JSON.stringify(throughType)
    }).done(function (data: InsertSiblingQueryResp) {
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
  callBackFunction = (_data: InsertChildQueryResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.insert_child, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType)
    }).done(function (data: InsertChildQueryResp) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//When the drag is complete, this is called to actually update the back-end
export function dragAction(
  action_data,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    COURSEFLOW_APP.tinyLoader.startLoad()
    $('.ui-draggable').draggable('disable')
    $.post(COURSEFLOW_APP.config.post_paths.inserted_at, action_data).done(
      function (data) {
        if (data.action === VERB.POSTED) callBackFunction(data)
        else window.fail_function(data.action)
        $('.ui-draggable').draggable('enable')
        COURSEFLOW_APP.tinyLoader.endLoad()
      }
    )
  } catch (err) {
    window.fail_function('The item failed to be inserted.')
    console.log(err)
  }
}

//Called when an object in a list is reordered
export function insertedAtInstant(
  objectID,
  objectType,
  parentID,
  parentType,
  newPosition,
  throughType,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    COURSEFLOW_APP.tinyLoader.startLoad()
    $('.ui-draggable').draggable('disable')
    $.post(COURSEFLOW_APP.config.post_paths.inserted_at, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      parentID: JSON.stringify(parentID),
      parentType: JSON.stringify(parentType),
      newPosition: JSON.stringify(newPosition),
      throughType: JSON.stringify(throughType),
      inserted: JSON.stringify(true),
      allowDifferent: JSON.stringify(true)
    }).done(function (data) {
      if (data.action === 'posted') callBackFunction(data)
      else window.fail_function(data.action)
      $('.ui-draggable').draggable('enable')
      COURSEFLOW_APP.tinyLoader.endLoad()
    })
  } catch (err) {
    window.fail_function('The item failed to be inserted.')
    console.log(err)
  }
}

//Get the list of possible disciplines
export function getDisciplines(
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.get(COURSEFLOW_APP.config.get_paths.get_disciplines).done(
      function (data) {
        callBackFunction(data)
      }
    )
  } catch (err) {
    window.fail_function()
  }
}

export function updateObjectSet(
  objectID,
  objectType,
  objectsetPk,
  add,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.update_object_set, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      objectsetPk: JSON.stringify(objectsetPk),
      add: JSON.stringify(add)
    }).done(function (data) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//get exported data
export function getExport(
  objectID,
  objectType,
  exportType,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_export, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      exportType: JSON.stringify(exportType)
    }).done(function (data, status, xhr) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}
