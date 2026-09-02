const project = {
  actions: {
    archive: 'Archive project',
    copy: 'Copy project',
    create: 'Create project',
    edit: 'Edit project',
    export: 'Export',
    permanentlyDelete: 'Permanently delete project',
    publish: 'Publish project',
    restore: 'Restore project',
    share: 'Sharing',
    unpublish: 'Unpublish project',
    update: 'Update project'
  },
  status: {
    archived: 'Archived',
    currentPublic: 'The project is currently public',
    currentPrivate: 'The project is currently private'
  },
  tabs: {
    overview: 'Overview',
    workflows: 'Workflows'
  },
  form: {
    title: 'Title',
    titlePlaceholder: 'Project title',
    description: 'Description',
    discipline: 'Discipline',
    titleRequired: 'Project title cannot be empty',
    titleMax: 'Project title cannot be longer than {{count}} characters',
    firstProjectTitle: 'Start by creating a project',
    firstProjectHelp:
      'All workflows, whether they are programs, courses, or activities, exist within projects. You must start by creating a project before proceeding to create any type of workflow.'
  },
  overview: {
    description: 'Description',
    disciplines: 'Disciplines',
    contributors: 'Contributors',
    emptyValue: '—',
    publishConfirmation:
      'Publishing this project will make all associated workflows visible to all CourseFlow users. Are you ready to share this content?'
  },
  tags: {
    title: 'Tags',
    addPlaceholder: 'Add new tag'
  },
  messages: {
    created: 'Your project has been successfully created',
    createFailed: 'We encountered an issue and your project was not created',
    updated: 'Your project has been successfully updated',
    updateFailed: 'We encountered an issue and your project was not updated',
    published: 'Your project has been successfully published',
    publishFailed: 'We encountered an issue and your project was not published',
    unpublished: 'Your project has been successfully unpublished',
    unpublishFailed:
      'We encountered an issue and your project was not unpublished'
  },
  errors: {
    notFound: 'Project does not exist',
    loadFailed: 'The project could not be loaded.'
  },
  exportDialog: {
    title: 'Export {{projectType}}',
    type: 'Export type',
    format: 'Export format',
    unavailable: 'Export is not yet available.',
    objectType: {
      project: 'project',
      program: 'program',
      course: 'course',
      activity: 'activity'
    },
    options: {
      outcome: 'Outcomes',
      node: 'Nodes',
      framework: 'Course framework',
      matrix: 'Competency matrix',
      sobec: 'SOBEC validation',
      excel: 'Excel',
      csv: 'CSV'
    }
  }
} as const

export default project
