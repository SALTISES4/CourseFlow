import { ProjectType } from '@cfCommonComponents/dialog/CreateWizard/components/ProjectSearch/types'
import projects from '@cfCommonComponents/dialog/CreateWizard/components/ProjectSearch/data'

import { TemplateType } from '@cfCommonComponents/dialog/CreateWizard/components/TemplateSearch/types'
import templates from '@cfCommonComponents/dialog/CreateWizard/components/TemplateSearch/data'

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
