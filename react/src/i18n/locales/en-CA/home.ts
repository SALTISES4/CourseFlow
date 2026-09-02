const home = {
  sections: {
    recentProjects: 'Recent projects',
    viewAllProjects: 'View all projects',
    exploreTemplates: 'Explore templates',
    getStartedTemplates: 'Get started with templates',
    viewAllTemplates: 'View all templates'
  },
  templates: {
    howToTitle: 'How to use templates',
    howToHelp:
      'Templates provide a pre-established structure anchored in pedagogical best practices so that you don’t need to start from scratch!'
  },
  welcome: {
    closeLabel: 'Close welcome message',
    title: 'Welcome to CourseFlow',
    prompt:
      'Tell us a bit more about your goals so that we can help you get started.',
    createActivity: 'I want to create an activity',
    createCourse: 'I want to create a course',
    createProgram: 'I want to create a program'
  }
} as const

export default home
