/*******************************************************
 * OUTCOME
 *******************************************************/
import { VERB } from '@cfModule/types/common'
import { SuccessPost } from '@XMLHTTP/types'
import { ToDefine } from '@cfModule/types/common'

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
  callBackFunction = (_data: SuccessPost) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.new_outcome, {
      workflowPk: JSON.stringify(workflowPk),
      objectsetPk: JSON.stringify(object_set_id)
    }).done(function (data: SuccessPost) {
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
