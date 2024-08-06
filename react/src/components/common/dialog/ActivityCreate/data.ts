import { ProjectType } from '@cfCommonComponents/dialog/CreateWizard/components/ProjectSearch/types'
import projects from '@cfCommonComponents/dialog/CreateWizard/components/ProjectSearch/data'

import { TemplateType } from '@cfCommonComponents/dialog/CreateWizard/components/TemplateSearch/types'
import templates from '@cfCommonComponents/dialog/CreateWizard/components/TemplateSearch/data'

export type CreateActivityDataType = {
  steps: string[]
  projects: ProjectType[]
  templates: TemplateType[]
}

const data: CreateActivityDataType = {
  steps: ['Select project', 'Select activity type', 'Create activity'],
  projects,
  templates
}

export default data
