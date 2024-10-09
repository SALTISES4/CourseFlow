import { CFRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/utilityFunctions'
import * as React from 'react'
import { NavLink, generatePath } from 'react-router-dom'

export function workflowUrl(workflow) {
  const base = CFRoutes.WORKFLOW
  return generatePath(base, { id: workflow.id })
}

export const WorkflowNavLink = ({ workflow }) => {
  const title = workflowTitle({
    title: workflow.title,
    code: workflow.code,
    deleted: workflow.deleted
  })

  const url = workflowUrl(workflow)

  return <NavLink to={url}>{title}</NavLink>
}

//Title text for a week
export class WeekTitle extends React.Component {
  render() {
    const data = this.props.data
    const defaultText = data.weekTypeDisplay + ' ' + (this.props.rank + 1)
    return <TitleText text={data.title} defaultText={defaultText} />
  }
}

//Title text for a node
export class NodeTitle extends React.Component {
  render() {
    const data = this.props.data
    let text
    if (data.representsWorkflow && data.linkedWorkflowData) {
      text = data.linkedWorkflowData.title
      if (data.linkedWorkflowData.code)
        text = data.linkedWorkflowData.code + ' - ' + text
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
