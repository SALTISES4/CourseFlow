import { CFRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/Utility.class'
import {TitleText, workflowTitle} from '@cfComponents/UIPrimitives/Titles.ts'
import { Component } from 'react'
import { NavLink, generatePath } from 'react-router-dom'

export function workflowUrl(workflow) {
  const base = CFRoutes.WORKFLOW
  return generatePath(base, { uuid: workflow.uuid })
}
