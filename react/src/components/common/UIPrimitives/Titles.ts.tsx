import { _t } from '@cf/utility/utilityFunctions'
import * as React from 'react'

/*******************************************************
 * COMPONENTS
 *******************************************************/
export const OutcomeTitle = ({
  title,
  hovertext,
  prefix
}: {
  title: string | null
  hovertext: string
  prefix: string
}) => {
  let text = title
  if (title == null || title == '') {
    text = _t('Untitled')
  }

  return (
    <div title={hovertext} className="title-text">
      <span>{prefix + ' - '}</span>
      <span dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  )
}
//Text that can be passed a default value. HTML is dangerously set.
export const TitleText = ({
  text,
  defaultText
}: {
  text: string | null
  defaultText: string
}) => {
  let finalText
  if ((text == null || text == '') && defaultText != null) {
    finalText = defaultText
  }
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

  // @todo check this condition
  // if (['noaccess', 'nouser'].includes(data.url)) {
  //   text += ` ${_t(' (no access)')}`
  // }

  if (deleted) {
    text += ' (deleted)'
  }
  return text
}

//Returns the outcome title as a string
/**
 *
 * @param data
 * @param prefix
 */
export function getOutcomeTitle({
  title,
  prefix
}: {
  title: string | null
  prefix: string
}) {
  let finalText = title
  if (title == null || title == '') {
    finalText = _t('Untitled')
  }

  return prefix + ' - ' + finalText
}
