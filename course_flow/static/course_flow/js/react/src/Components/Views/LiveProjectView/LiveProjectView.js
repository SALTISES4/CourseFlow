import * as React from 'react'
import * as reactDom from 'react-dom'
import {
  DatePicker,
  AssignmentTitle,
  WorkflowTitle,
  NodeTitle,
  TitleText,
  ActionButton,
  SimpleWorkflow
} from '../../components/CommonComponents.js'
import { WorkflowForMenu } from '../../../Library.js'
import {
  setAssignmentCompletion,
  createAssignment,
  getLiveProjectData,
  getLiveProjectDataStudent,
  setWorkflowVisibility,
  getWorkflowNodes
} from '../../../PostFunctions.js'
import { StudentManagement } from '../../components/StudentManagement.js'
import { AssignmentViewSmall } from '../LiveAssignmentView'
import * as Constants from '../../../Constants.js'
import * as Utility from '../../../UtilityFunctions.js'
import { LiveProjectSection } from './LiveProjectSection.js'
