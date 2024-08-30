import { ProjectType } from '@cfPages/Styleguide/dialog/CreateWizard/components/ProjectSearch/types'
import projects from '@cfPages/Styleguide/dialog/CreateWizard/components/ProjectSearch/data'

import { TemplateType } from '@cfPages/Styleguide/dialog/CreateWizard/components/TemplateSearch/types'
import templates from '@cfPages/Styleguide/dialog/CreateWizard/components/TemplateSearch/data'

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
