
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
