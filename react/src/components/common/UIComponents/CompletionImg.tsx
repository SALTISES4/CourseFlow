import * as React from 'react'

/**
 * Based on an outcomenode's completion status, return the correct icon
 *
 * @param completionStatus
 * @param outcomesType
 * @returns {JSX.Element|*[]}
 */
const CompletionImg = ({
  completionStatus,
  outcomesType
}): JSX.Element | any[] => {
  const contents = []

  if (outcomesType === 0 || completionStatus & 1) {
    return (
      <img
        className="self-completed"
        src={COURSEFLOW_APP.config.icon_path + 'solid_check.svg'}
      />
    )
  }
  if (completionStatus & 2) {
    const divclass = ''
    contents.push(
      <div className={'outcome-introduced outcome-degree' + divclass}>I</div>
    )
  }
  if (completionStatus & 4) {
    const divclass = ''
    contents.push(
      <div className={'outcome-developed outcome-degree' + divclass}>D</div>
    )
  }
  if (completionStatus & 8) {
    const divclass = ''
    contents.push(
      <div className={'outcome-advanced outcome-degree' + divclass}>A</div>
    )
  }
  return contents
}

export default CompletionImg
