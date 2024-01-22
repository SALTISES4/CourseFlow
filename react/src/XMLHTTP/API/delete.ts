
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
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}


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
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}