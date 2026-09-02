const workspace = {
  roles: { editor: 'Editor', commenter: 'Commenter', viewer: 'Viewer' },
  contributor: {
    added: 'The contributor was added to your project.',
    addFailed: 'The contributor could not be added to your project.',
    removed: 'The contributor was removed from your project.',
    removeFailed: 'The contributor could not be removed from your project.',
    addTitle: 'Add contributor',
    users: 'CourseFlow users',
    role: 'Role',
    removeTitle: 'Remove user?',
    removeConfirmation: 'Are you sure you want to remove {{name}}?'
  },
  lifecycle: {
    object: { project: 'project', workflow: 'workflow' },
    archiveTitle: 'Archive {{object}}',
    archiveWarning:
      'Once your {{object}} is archived, it cannot be opened from the workspace. You can restore it from your archived library items.',
    archiveAction: 'Archive {{object}}',
    archiveSuccess: 'The {{object}} has been archived.',
    restoreTitle: 'Restore {{object}}',
    restoreQuestion: 'Do you want to restore your {{object}}?',
    restoreAction: 'Restore {{object}}',
    restoreSuccess: 'The {{object}} has been restored.'
  }
} as const

export default workspace
