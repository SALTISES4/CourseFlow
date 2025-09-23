import { RelatedTabType } from '../../types'

const data: RelatedTabType = {
  title: 'Outcomes from parent workflows',
  subtitle:
    'Drag and drop to associate outcomes from parents workflows to outcomes of your current workflow. Click on an outcome to highlight relevant nodes.',
  alert: true,

  // TODO: dummy data, but we actually only needs to use IDs
  // of the root level outcomes (groups) and UI then takes over
  // SEE: OutcomesTab/data.ts
  groups: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}

export default data
