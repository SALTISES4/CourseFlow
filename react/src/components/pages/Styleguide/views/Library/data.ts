import { FilterOption } from '@cfPages/Styleguide/components/FilterButton'
import { ResultType } from '@cfPages/Styleguide/components/FilterWorkflows'
import { PropsType as WorkflowCardDumbPropsType } from '@cfPages/Styleguide/components/WorkflowCard'
import { ChipMode } from '@cfPages/Styleguide/components/WorkflowCard/types'
import homepageData from '@cfPages/Styleguide/views/Homepage/data'

type DataType = {
  workflows: ResultType[]
  templates: WorkflowCardDumbPropsType[]
  filterSortOptions: FilterOption[]
  filterProjectOptions: FilterOption[]
}

const data: DataType = {
  filterSortOptions: [
    {
      name: 'recent',
      label: 'Recent'
    },
    {
      name: 'a-z',
      label: 'A - Z'
    },
    {
      name: 'date',
      label: 'Creation date'
    }
  ],
  filterProjectOptions: [
    {
      name: 'all',
      label: 'All Projects',
      selected: true
    },
    {
      name: 'owned',
      label: 'Owned'
    },
    {
      name: 'shared',
      label: 'Shared'
    },
    {
      name: 'favorites',
      label: 'Favorites'
    },
    {
      name: 'archived',
      label: 'Archived'
    }
  ],
  workflows: [
    {
      id: 1,
      group: 'Biology 101',
      name: 'Active Activity',
      chip: {
        type: ChipMode.ACTIVITY,
        label: 'Activity'
      }
    },
    {
      id: 2,
      group: 'Biology 101',
      name: 'Act as a project',
      chip: {
        type: ChipMode.PROJECT,
        label: 'Project'
      }
    },
    {
      id: 3,
      group: 'Biology 101',
      name: 'Le programming course',
      chip: {
        type: ChipMode.COURSE,
        label: 'Course'
      }
    },
    {
      id: 4,
      group: 'Biology 101',
      name: 'Pro gramming',
      chip: {
        type: ChipMode.PROGRAM,
        label: 'Program'
      }
    },
    {
      id: 5,
      group: 'Biology 101',
      name: 'Stay on course',
      chip: {
        type: ChipMode.COURSE,
        label: 'Course'
      }
    },
    {
      id: 6,
      group: 'Biology 101',
      name: 'Projecting failure',
      chip: {
        type: ChipMode.PROJECT,
        label: 'Project'
      }
    },
    {
      id: 7,
      group: 'Biology 101',
      name: 'Programmable and flammable',
      chip: {
        type: ChipMode.PROGRAM,
        label: 'Program'
      }
    },
    {
      id: 8,
      group: 'Biology 101',
      name: 'Why is this course so hard',
      chip: {
        type: ChipMode.COURSE,
        label: 'Course'
      }
    },
    {
      id: 9,
      group: 'Biology 101 is super super long here',
      name: 'The activities are killing me with all these long titles',
      chip: {
        type: ChipMode.ACTIVITY,
        label: 'Activity'
      }
    },
    {
      id: 10,
      group: 'Biology 101',
      name: 'Programming is da best',
      chip: {
        type: ChipMode.PROGRAM,
        label: 'Program'
      }
    },
    {
      id: 11,
      group: 'Biology 101',
      name: 'This is a super nice project',
      chip: {
        type: ChipMode.PROJECT,
        label: 'Project'
      }
    },
    {
      id: 12,
      group: 'Biology 101',
      name: 'Courseflow course',
      chip: {
        type: ChipMode.COURSE,
        label: 'Course'
      }
    }
  ],
  templates: homepageData.templates
}

export default data
