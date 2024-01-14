//Causes the specified object to delete itself
import {
  DeleteSelfQueryResp,
  DuplicateSelfQueryResp,
  RestoreSelfQueryResp
} from '@XMLHTTP/types'
import { DATA_ACTIONS } from '@XMLHTTP/common'
import { ToDefine } from '@cfModule/types/common'

//Causes the specified object to delete itself
export function deleteSelfLive(
  objectID,
  objectType,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  const path = COURSEFLOW_APP.config.post_paths.delete_self_live
  try {
    $.post(path, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

export function deleteSelfQuery(
  objectID: number,
  objectType: any,
  soft = false,
  callBackFunction = (_data: DeleteSelfQueryResp) => console.log('success')
) {
  let path
  if (soft) path = COURSEFLOW_APP.config.post_paths.delete_self_soft
  else path = COURSEFLOW_APP.config.post_paths.delete_self

  try {
    $.post(path, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType)
    }).done(function (data: DeleteSelfQueryResp) {
      console.log('deleteSelfQuery data')
      console.log(data)
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Causes the specified object to insert a sibling after itself
export function duplicateSelfQuery(
  objectID: number,
  objectType: any,
  parentID: number,
  parentType: any,
  throughType: any,
  callBackFunction = (_data: DuplicateSelfQueryResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.duplicate_self, {
      parentID: JSON.stringify(parentID),
      parentType: JSON.stringify(parentType),
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      throughType: JSON.stringify(throughType)
    }).done(function (data: DuplicateSelfQueryResp) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

/*******************************************************
 * OBJECT SELF ACTIONS
 *******************************************************/
//Causes the specified object to undelete itself
export function restoreSelfQuery(
  objectID: number,
  objectType: any,
  callBackFunction = (_data: RestoreSelfQueryResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.restore_self, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType)
    }).done(function (data: RestoreSelfQueryResp) {
      console.log('restoreSelfQuery data')
      console.log(data)
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}
