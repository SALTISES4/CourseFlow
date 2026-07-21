import { CFRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/Utility.class'
import { generatePath } from 'react-router-dom'

/*******************************************************
 * COMPONENTS
 *******************************************************/

//Text that can be passed a default value. HTML is dangerously set.
export const TitleText = ({
  text,
  defaultText
}: {
  text: string | null
  defaultText: string
}) => {
  const finalText = text || defaultText
  return (
    <div
      className="title-text"
      title={finalText}
      dangerouslySetInnerHTML={{ __html: finalText }}
    />
  )
}

/*******************************************************
 * FUNCTION
 *******************************************************/
export function workflowUrl(workflow) {
  const base = CFRoutes.WORKFLOW
  return generatePath(base, { uuid: workflow.uuid })
}

export function workflowTitle({
  title,
  code,
  deleted
}: {
  title: string
  code: string
  deleted: boolean
}) {
  let text = title || _t('Untitled')

  if (code) {
    text = `${code} - ${text}`
  }

  if (deleted) {
    text += ' (deleted)'
  }
  return text
}
