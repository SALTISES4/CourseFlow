import { CFRoutes } from '@cf/router/appRoutes'
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
  deleted,
  fallbackText,
  deletedText
}: {
  title: string
  code: string
  deleted: boolean
  fallbackText: string
  deletedText: string
}) {
  let text = title || fallbackText

  if (code) {
    text = `${code} - ${text}`
  }

  if (deleted) {
    text += ` (${deletedText})`
  }
  return text
}
