import { ToggleStrategyQueryResp } from '@XMLHTTP/types/query'
import { VERB } from '@cfModule/types/common'
import { AddStrategyQueryResp } from '@XMLHTTP/types'

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

//Add a strategy to the workflow
export function addStrategyQuery(
  workflowPk: number,
  position = -1,
  strategyPk = -1,
  callBackFunction = (_data: AddStrategyQueryResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.add_strategy, {
      workflowPk: JSON.stringify(workflowPk),
      position: JSON.stringify(position),
      objectID: JSON.stringify(strategyPk),
      objectType: JSON.stringify('workflow')
    }).done(function (data: AddStrategyQueryResp) {
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
