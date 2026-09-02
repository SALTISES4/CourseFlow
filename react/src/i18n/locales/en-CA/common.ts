const common = {
  actions: {
    add: 'Add',
    cancel: 'Cancel',
    clear: 'Clear',
    close: 'Close',
    confirm: 'Confirm',
    continue: 'Continue',
    delete: 'Delete',
    duplicate: 'Duplicate',
    remove: 'Remove',
    save: 'Save',
    update: 'Update'
  },
  labels: {
    all: 'All',
    archived: 'Archived',
    close: 'Close',
    deletedSuffix: 'deleted',
    favourite: 'Favourite',
    filter: 'Filter',
    find: 'Find',
    none: 'None',
    sort: 'Sort',
    untitled: 'Untitled'
  },
  duration: { days: 'Days', hours: 'Hours' },
  navigation: {
    home: 'Home',
    myLibrary: 'My library',
    explore: 'Explore',
    favourites: 'Favourites',
    viewAll: 'View all',
    helpSupport: 'Help and Support',
    collapseSidebar: 'Collapse sidebar',
    profile: 'Profile',
    passwordReset: 'Password reset',
    notificationSettings: 'Notification settings',
    signOut: 'Sign out',
    addMenu: 'Add menu',
    accountMenu: 'Current user account'
  },
  favourites: {
    added: 'Added to your favourites.',
    removed: 'Removed from your favourites.',
    updateFailed: 'Favourite status could not be updated.'
  },
  cards: {
    ownedBy: 'Owned by {{name}}',
    linkedWorkflowWarning: 'Linking the same workflow to multiple nodes can reduce readability when parent and child workflow outcomes are associated.',
    alreadyInUse: 'Already in use'
  },
  lifecycle: {
    restored: 'Your {{object}} was restored.',
    parentRestored: 'Your project was restored.',
    permanentlyDeleted: 'Your {{object}} was permanently deleted.',
    restoreProject: 'Restore project',
    restore: 'Restore',
    deletePermanently: 'Delete permanently',
    restoreParentTitle: 'Restore parent project',
    permanentlyDeleteTitle: 'Permanently delete {{object}}',
    restoreParentWarning: 'This workflow belongs to an archived project. Restore the project and all of its workflows?',
    permanentlyDeleteWarning: 'This {{object}} will be permanently deleted and cannot be recovered.',
    deleteObject: 'Delete {{object}}',
    object: { project: 'project', workflow: 'workflow' }
  },
  loading: 'Loading…',
  language: {
    english: 'English',
    french: 'French'
  },
  errors: {
    unexpected: 'Something went wrong. Please try again.',
    requestFailed: 'The request could not be completed.',
    routeFailed: 'This page could not be displayed.'
  },
  fileUpload: {
    clickToUpload: 'Click to upload',
    dragAndDrop: 'or drag and drop',
    removeFile: 'Remove file',
    uploadFailed: 'Upload failed',
    fileTooLarge: 'File too large',
    fileTooSmall: 'File too small',
    invalidType: 'Unsupported file type',
    tooManyFiles: 'Too many files',
    rejected: 'File could not be accepted',
    fileSize: '{{size}} {{unit}}',
    units: {
      kilobytes: 'KB',
      megabytes: 'MB'
    },
    complete: 'Complete',
    loading: 'Loading',
    failed: 'Failed'
  },
  messages: {
    success: 'Success!'
  },
  access: {
    projectArchived: 'This project has been archived.',
    workflowArchived: 'This workflow has been archived.',
    projectDenied: 'You do not have access to this project.',
    workflowDenied: 'You do not have access to this workflow.'
  },
  examples: {
    greeting: 'Hello, {{name}}',
    selectedItem_one: '{{count}} item selected',
    selectedItem_other: '{{count}} items selected'
  }
} as const

export default common
