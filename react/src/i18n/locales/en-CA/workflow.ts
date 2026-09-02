const workflow = {
  type: {
    program: 'Program',
    activity: 'Activity',
    course: 'Course',
    task: 'Task',
    workflow: 'Workflow',
    programLower: 'program',
    activityLower: 'activity',
    courseLower: 'course',
    taskLower: 'task',
    workflowLower: 'workflow'
  },
  tabs: {
    overview: 'Overview',
    workflow: 'Workflow',
    outcomes: 'Outcomes'
  },
  overview: {
    description: 'Description',
    emptyValue: '—',
    disciplines: 'Disciplines',
    noDisciplines: 'No disciplines found.',
    createdOn: 'Created on',
    permissions: 'Permissions',
    copyPublicLink: 'Copy public link',
    removePublicLink: 'Remove public link',
    generatePublicLink: 'Generate public link'
  },
  metadata: {
    time: 'Time',
    calculateTime: 'Calculate time automatically',
    credits: 'Credits',
    calculateCredits: 'Calculate credits automatically',
    ponderation: 'Ponderation',
    calculatePonderation: 'Calculate ponderation automatically',
    ponderationMismatch:
      'The total ponderation hours do not match the {{workflowType}} time.',
    classification: 'Classification',
    calculateClassification: 'Calculate classification automatically',
    classificationMismatch:
      'The total classification hours do not match the program time.',
    code: 'Code',
    theory: 'Theory',
    practical: 'Practical',
    individual: 'Individual',
    generalTime: 'General time',
    specificTime: 'Specific time'
  },
  messages: {
    metadataSaveFailed: 'Workflow metadata could not be saved.',
    publicLinkEnabled: 'Public link enabled.',
    publicLinkRemoved: 'Public link removed.',
    publicLinkUpdateFailed: 'Public link could not be updated.',
    publicLinkCopied: 'Public link copied.',
    publicLinkCopyFailed: 'Public link could not be copied.',
    roleUpdated: 'The contributor’s role was updated.',
    roleUpdateFailed: 'The contributor’s role could not be updated.',
    commentDeleted: 'Your comment was deleted.',
    commentDeleteFailed: 'Your comment could not be deleted.',
    copied: 'The {{workflowType}} was copied.',
    copyFailed: 'The {{workflowType}} could not be copied.',
    updated: 'Your {{workflowType}} was updated.',
    updateFailed: 'Your {{workflowType}} could not be updated.'
  },
  permissions: {
    owner: 'Owner',
    removeContributor: 'Remove contributor',
    addUser: 'Add CourseFlow user'
  },
  legend: {
    show: 'Show legend',
    title: 'Legend',
    tasks: 'Tasks',
    contexts: 'Contexts'
  },
  outcomes: {
    howToTitle: 'How to use outcomes',
    howToHelp:
      'In this view you can add and edit outcomes for this workflow. Once added, outcomes can be attached to nodes within your workflow by navigating to the “Workflow” tab and dragging outcomes from the right sidebar onto nodes.',
    add: 'Add outcome',
    addPlural: 'Add outcomes',
    title: 'Outcomes',
    sidebarHelp:
      'Drag and drop to associate outcomes from parent workflows with outcomes in the current workflow. Select an outcome to highlight relevant nodes.',
    edit: 'Edit outcomes',
    editOne: 'Edit outcome',
    addRequired:
      'Add outcomes before attaching them to nodes and outcomes in the current workflow.',
    empty: 'There are currently no outcomes in this {{workflowType}}. Open the outcomes view to add outcomes.',
    fromParents: 'Outcomes from parent workflows',
    untitled: 'Untitled outcome',
    untagged: 'Untagged',
    insertSibling: 'Insert sibling',
    insertChild: 'Insert child'
  },
  comments: {
    title: 'Comments',
    selectItem: 'Select an item to view or add comments.',
    unavailable: 'Comments are not available for this item yet.',
    loading: 'Loading comments',
    loadFailed: 'Comments could not be loaded.',
    addPlaceholder: 'Add a comment',
    add: 'Add comment'
  },
  sidebar: {
    tabLabel: '{{tab}} tab',
    tabs: {
      edit: 'Edit',
      add: 'Add',
      comments: 'Comments',
      outcomes: 'Outcomes',
      related: 'Related'
    },
    unavailableTitle: 'Unavailable',
    unsupportedEditor: 'The {{type}} editor is not supported yet.'
  },
  richText: {
    description: 'Description',
    toolbar: 'Description formatting',
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    superscript: 'Superscript',
    subscript: 'Subscript',
    bulletedList: 'Bulleted list',
    numberedList: 'Numbered list',
    list: 'List',
    link: 'Link',
    linkUrl: 'Link URL'
  },
  wizard: {
    selectProject: 'Select project',
    selectType: 'Select {{workflowType}} type',
    create: 'Create {{workflowType}}',
    createFromTemplate: 'Create {{workflowType}} from a template',
    createBlank: 'Create blank {{workflowType}}',
    created: 'Your {{workflowType}} has been successfully created.',
    createFailed: 'We encountered an issue and your {{workflowType}} was not created.',
    previousStep: 'Previous step',
    nextStep: 'Next step',
    blank: 'Blank {{workflowType}}',
    recommendedAdvanced: 'Recommended for advanced users',
    blankDescription: 'Create your own tailored {{workflowType}} structure',
    fromTemplate: 'From a template',
    recommendedBeginners: 'Recommended for beginners',
    templateDescription: 'Get a head start with a template anchored in best practices'
  },
  unavailableView: 'This view is not available.',
  related: {
    appearsIn: 'Appears in',
    contains: 'Contains',
    returnTo: 'Return to',
    returnToEditable: 'Return to editable workflow',
    multipleLinksWarning: 'This workflow is linked to multiple nodes. Outcomes from different parent workflows, or duplicate outcomes, may appear.',
    unlinkOutcome: 'Unlink outcome'
  },
  addPanel: {
    title: 'Add to workflow',
    insertMode: 'Insert mode',
    insertModeHelp:
      'Row mode forces nodes into a vertical sequence. Column mode allows multiple nodes side by side. Manual mode prompts you to choose a layout for each new node.',
    manual: 'Manual',
    row: 'Row',
    column: 'Column',
    nodeCategories: 'Node categories',
    customNodeCategory: 'Custom node category'
  },
  edit: {
    node: 'Edit node',
    nodeLink: 'Edit node link',
    nodeCategory: 'Edit node category',
    section: 'Edit section',
    title: 'Title',
    titleRequired: 'Title is required',
    description: 'Description',
    context: 'Context',
    type: 'Type',
    time: 'Time',
    credits: 'Credits',
    ponderation: 'Ponderation',
    theoryHours: 'Hrs. theory',
    practiceHours: 'Hrs. practice',
    individualHours: 'Hrs. individual',
    specificEducation: 'Specific education',
    tags: 'Tags',
    sectionLabel: 'Section',
    textPosition: 'Text position',
    dashedLine: 'Dashed line'
  },
  linkAction: {
    linkCourse: 'Link a course',
    removeCourse: 'Remove linked course',
    linkActivity: 'Link an activity',
    removeActivity: 'Remove linked activity',
    linkWorkflow: 'Link workflow',
    removeWorkflow: 'Remove linked workflow'
  },
  linked: {
    course: 'Linked course',
    activity: 'Linked activity',
    workflow: 'Linked workflow',
    untitledNode: 'Untitled node'
  },
  graph: {
    untitledNodeCategory: 'Untitled node category',
    emptySection:
      'Drag nodes from the sidebar or another section to add them here.',
    insertRight: 'Insert right',
    insertRow: 'Insert row',
    keepSameColumn: 'Keep in same column',
    insertNodeBelow: 'Insert node below',
    duplicateNodeBelow: 'Duplicate node below',
    deleteNode: 'Delete node',
    insertSectionBelow: 'Insert section below',
    duplicateSectionBelow: 'Duplicate section below',
    deleteSection: 'Delete section'
  },
  systemLabels: {
    channel: {
      activity_out_of_class_instructor: 'Out of class (instructor)',
      activity_out_of_class_students: 'Out of class (students)',
      activity_in_class_instructor: 'In class (instructor)',
      activity_in_class_students: 'In class (students)',
      course_preparation: 'Preparation',
      course_lesson: 'Lesson',
      course_artifact: 'Artifact',
      course_assessment: 'Assessment',
      custom_node_category: 'Custom node category'
    },
    copy: '{{title}} (copy)',
    copyNumbered: '{{title}} (copy {{count}})',
    sectionNumber: 'Section {{number}}',
    expandSection: 'Expand section',
    collapseSection: 'Collapse section'
  },
  menu: {
    edit: 'Edit workflow',
    sharing: 'Sharing',
    export: 'Export',
    importOutcomes: 'Import outcomes',
    importNodes: 'Import nodes',
    archive: 'Archive {{workflowType}}',
    copy: 'Copy {{workflowType}}',
    restore: 'Restore workflow',
    permanentlyDelete: 'Permanently delete workflow',
    viewSettings: 'View settings',
    expandSections: 'Expand all sections',
    expandNodes: 'Expand all nodes',
    expandOutcomes: 'Expand all outcomes',
    jumpTo: 'Jump to',
    notConnected: 'Not connected',
    onlineUsers: 'Online users',
    deleteConfirmation: 'Are you sure you want to permanently delete this workflow?'
  },
  searchProjects: {
    loadFailed: 'Projects could not be loaded.',
    noEligibleTitle: 'You are not an owner or editor of any projects',
    noEligibleDescription:
      'All programs, courses, and activities belong to projects. Create a project or ask a project owner to add you as an editor before creating a workflow.',
    placeholder: 'Search in projects…',
    noResults: 'No results found'
  },
  linkDialog: {
    courseTitle: 'Link a course',
    activityTitle: 'Link an activity',
    search: 'Search',
    loadFailed: 'Workflows could not be loaded.',
    noExactMatches: 'There are no exact matches.',
    noCourse: 'No course found',
    noActivity: 'No activity found',
    linkCourse: 'Link course',
    linkActivity: 'Link activity'
  },
  copyDialog: {
    title: 'Copy {{workflowType}}',
    loadFailed: 'The workflow could not be loaded.',
    submit: 'Copy {{workflowType}}'
  },
  form: {
    editTitle: 'Edit {{workflowType}}',
    update: 'Update {{workflowType}}',
    title: 'Title',
    titleForType: '{{workflowType}} title',
    titleRequired: 'Title is required',
    titleMax: 'Title cannot be longer than {{count}} characters',
    description: 'Description',
    descriptionForType: '{{workflowType}} description',
    copyTitle: '{{title}} (copy)'
  },
  deleteSection: {
    title: 'You are about to delete a section',
    warning:
      'Deleting this section will also delete every node in it. Are you sure you want to proceed?',
    submit: 'Delete section'
  },
  deleteNodeCategory: {
    title: 'You are about to delete a node category',
    warning:
      'Deleting this node category will also delete every associated node. Are you sure you want to proceed?',
    submit: 'Delete node category'
  }
} as const

export default workflow
