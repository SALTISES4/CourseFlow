
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

//Causes the specified throughmodel to update its degree
export function updateOutcomenodeDegree(
  nodeID: number,
  outcomeID: number,
  value,
  callBackFunction = (_data: UpdateOutcomenodeDegreeResp) =>
    console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.update_outcomenode_degree, {
      nodePk: JSON.stringify(nodeID),
      outcomePk: JSON.stringify(outcomeID),
      degree: JSON.stringify(value)
    }).done(function (data: UpdateOutcomenodeDegreeResp) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Add an outcome from the parent workflow to an outcome from the current one
export function updateOutcomehorizontallinkDegree(
  outcomePk,
  outcome2Pk,
  degree,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(
      COURSEFLOW_APP.config.post_paths.update_outcomehorizontallink_degree,
      {
        outcomePk: JSON.stringify(outcomePk),
        objectID: JSON.stringify(outcome2Pk),
        objectType: JSON.stringify('outcome'),
        degree: JSON.stringify(degree)
      }
    ).done(function (data) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}


//Set the linked workflow for the node
export function setLinkedWorkflow(
  node_id,
  workflow_id,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  $.post(COURSEFLOW_APP.config.post_paths.set_linked_workflow, {
    nodePk: node_id,
    workflowPk: workflow_id
  }).done(function (data) {
    if (data.action === VERB.POSTED) callBackFunction(data)
    else window.fail_function(data.action)
  })
}


/**
 * Turn a week into a strategy or vice versa
 *
 * @param weekPk
 * @param is_strategy
 * @param callBackFunction
 */
export function toggleStrategyQuery(
  weekPk: number,
  is_strategy: boolean,
  callBackFunction = (_data: ToggleStrategyQueryResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.toggle_strategy, {
      weekPk: JSON.stringify(weekPk),
      is_strategy: JSON.stringify(is_strategy)
    }).done(function (data: ToggleStrategyQueryResp) {
      console.log('toggleStrategyQuery data')
      console.log(data)
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
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

//Toggle whether an item belongs to a user's favourites
export function toggleFavourite(
  objectID,
  objectType,
  favourite,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.toggle_favourite, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      favourite: JSON.stringify(favourite)
    }).done(function (data) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}
