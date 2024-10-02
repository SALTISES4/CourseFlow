import { wrapLeafStrings } from '@cf/utility/utilityFunctions'

const stringsRoot = {
  confirmEmailUpdates:
    'Hi there! Would you like to receive emails about updates to CourseFlow? You can always change your mind by viewing your profile.',
  unsupportedDevice:
    'Your device is not supported. Please use a laptop or desktop for the best experience.',
  productUpdatesAgree: 'I want to receive product updates emails',
  notifications: 'Notifications',
  home: 'Home',
  myLibrary: 'My library',
  explore: 'Explore',
  myClassrooms: 'My classrooms',
  favourites: 'Favourites',
  seeAll: 'See all',
  viewAll: 'View all',
  helpSupport: 'Help and Support',
  cancel: 'Cancel',
  passwordReset: 'Password reset',
  passwordResetMsg:
    'By choosing to reset your password, you will be directed to the SALTISE lobby and will have to navigate to the myDALITE application to set a new password.',
  notificationSettings: 'Notification settings',
  signOut: 'Sign out',
  profile: 'Profile',
  project: 'Project',
  program: 'Program',
  course: 'Course',
  activity: 'Activity',
  delete: 'Delete',
  showNotificationsMenu: 'Show notifications menu',
  notificationOptions: 'Notification options',
  markAsRead: 'Mark as read',
  markAllAsRead: 'Mark all as read',
  noNotificationsYet: 'You have no notifications yet.',
  profileSettings: 'Profile settings',
  updateProfile: 'Update profile',
  updateProfileSuccess: 'User details updated!',
  workflowArchiveSuccess: 'The Workflow has been archived',
  projectArchiveSuccess: 'The Project has been archived',
  projectArchiveFailure: 'There was an error archiving your project',
  workflowArchiveFailure: 'There was an error archiving your workflow',
  workflowUnarchiveFailure: 'There was an error unarchiving your workflow',
  projectUnarchiveFailure: 'There was an error unarchiving your project',
  projectUnarchiveSuccess: 'The Project has been unarchived',
  workflowUnarchiveSuccess: 'The Workflow has been unarchived',
  firstName: 'First Name',
  lastName: 'Last Name',
  languagePreferences: 'Language Preferences'
}

export default wrapLeafStrings<typeof stringsRoot>(stringsRoot)
