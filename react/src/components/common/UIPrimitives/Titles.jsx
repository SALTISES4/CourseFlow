import { CFRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/Utility.class'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import { Component } from 'react'
import { NavLink, generatePath } from 'react-router-dom'

export function workflowUrl(workflow) {
  const base = CFRoutes.WORKFLOW
  return generatePath(base, { uuid: workflow.uuid })
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

//Title text for a section
export class SectionTitle extends Component {
  render() {
    const data = this.props.data
    const defaultText = data.sectionTypeDisplay + ' ' + (this.props.rank + 1)
    return <TitleText text={data.title} defaultText={defaultText} />
  }
}
