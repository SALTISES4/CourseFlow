import { OutcomesTabType } from '../../types'

const data: OutcomesTabType = {
  title: 'Outcomes',
  subtitle:
    'Drag and drop to associate outcomes to nodes. Click on an outcome to highlight relevant nodes.',

  // TODO: dummy data, but we actually only needs to use IDs
  // of the root level outcomes (groups) and UI then takes over
  // SEE: RelatedTab/data.ts
  groups: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}

export default data
