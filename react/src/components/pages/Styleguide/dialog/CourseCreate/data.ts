import projects from '@cfPages/Styleguide/dialog/CreateWizard/components/ProjectSearch/data'
import { ProjectType } from '@cfPages/Styleguide/dialog/CreateWizard/components/ProjectSearch/types'
import templates from '@cfPages/Styleguide/dialog/CreateWizard/components/TemplateSearch/data'
import { TemplateType } from '@cfPages/Styleguide/dialog/CreateWizard/components/TemplateSearch/types'

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
