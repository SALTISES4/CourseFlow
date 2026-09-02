const library = {
  sort: {
    alphabetical: 'A – Z',
    dateCreated: 'Date created'
  },
  filters: {
    ownership: 'Ownership',
    owned: 'Owned',
    shared: 'Shared',
    discipline: 'Discipline',
    findDiscipline: 'Find discipline',
    type: 'Type',
    projects: 'Projects',
    workflows: 'Workflows',
    workflowType: 'Workflow type',
    activity: 'Activity',
    course: 'Course',
    program: 'Program',
    templates: 'Templates',
    favourites: 'Favourites',
    archive: 'Archive',
    search: 'Search'
  },
  results: {
    summary_one: 'Showing {{range}} of {{count}} result',
    summary_other: 'Showing {{range}} of {{count}} results',
    none: 'No results found',
    notFound: 'The content you were looking for was not found.',
    loadFailed: 'The library could not be loaded.',
    searchFailed: 'Search suggestions could not be loaded.',
    seeAll: '+ See all'
  },
  cards: {
    type: {
      project: 'Project',
      program: 'Program',
      course: 'Course',
      activity: 'Activity',
      task: 'Task',
      workflow: 'Workflow'
    },
    strategy: 'strategy',
    template: 'Template',
    workflowCount_one: '{{count}} workflow',
    workflowCount_other: '{{count}} workflows'
  }
} as const

export default library
