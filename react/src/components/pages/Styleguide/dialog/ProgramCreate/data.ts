import { ProjectType } from '@cfPages/Styleguide/dialog/CreateWizard/components/ProjectSearch/types'
import projects from '@cfPages/Styleguide/dialog/CreateWizard/components/ProjectSearch/data'

import { TemplateType } from '@cfPages/Styleguide/dialog/CreateWizard/components/TemplateSearch/types'
import templates from '@cfPages/Styleguide/dialog/CreateWizard/components/TemplateSearch/data'

export type CreateProgramDataType = {
  steps: string[]
  projects: ProjectType[]
  templates: TemplateType[]
}

const data: CreateProgramDataType = {
  steps: ['Select project', 'Select program type', 'Create program'],
  projects,
  templates
}

export default data
