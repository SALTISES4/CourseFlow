import { ProjectType } from '@cfCommonComponents/dialog/CreateWizard/components/ProjectSearch/types'
import projects from '@cfCommonComponents/dialog/CreateWizard/components/ProjectSearch/data'

import { TemplateType } from '@cfCommonComponents/dialog/CreateWizard/components/TemplateSearch/types'
import templates from '@cfCommonComponents/dialog/CreateWizard/components/TemplateSearch/data'

export type CreateCourseDataType = {
  steps: string[]
  projects: ProjectType[]
  templates: TemplateType[]
}

const data: CreateCourseDataType = {
  steps: ['Select project', 'Select course type', 'Create course'],
  projects,
  templates
}

export default data
