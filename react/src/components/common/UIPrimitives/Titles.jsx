import { _t } from '@cf/utility/utilityFunctions'
import * as React from 'react'

//Text that can be passed a default value. HTML is dangerously set.
export class TitleText extends React.Component {
  render() {
    let text = this.props.text
    if (
      (this.props.text == null || this.props.text == '') &&
      this.props.defaultText != null
    ) {
      text = this.props.defaultText
    }
    return (
      <div
        className="title-text"
        title={text}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    )
  }
}

export function workflowTitle(title, code, deleted) {
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

//Title text for a week
export class WeekTitle extends React.Component {
  render() {
    const data = this.props.data
    const default_text = data.week_type_display + ' ' + (this.props.rank + 1)
    return <TitleText text={data.title} defaultText={default_text} />
  }
}

//Title text for a node
export class NodeTitle extends React.Component {
  render() {
    const data = this.props.data
    let text
    if (data.represents_workflow && data.linked_workflow_data) {
      text = data.linked_workflow_data.title
      if (data.linked_workflow_data.code)
        text = data.linked_workflow_data.code + ' - ' + text
    } else text = data.title

    if (text == null || text == '') {
      text = _t('Untitled')
    }

    return (
      <div
        className="node-title"
        title={text}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    )
  }
}

//Title for an outcome
export class OutcomeTitle extends React.Component {
  render() {
    const data = this.props.data
    let text = data.title
    if (data.title == null || data.title == '') {
      text = _t('Untitled')
    }

    return (
      <div title={this.props.hovertext} className="title-text">
        <span>{this.props.prefix + ' - '}</span>
        <span dangerouslySetInnerHTML={{ __html: text }} />
      </div>
    )
  }
}

//Returns the outcome title as a string
export function getOutcomeTitle(data, prefix) {
  let text = data.title
  if (data.title == null || data.title == '') {
    text = _t('Untitled')
  }

  return prefix + ' - ' + text
}
