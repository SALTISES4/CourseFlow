import { wrapLeafStrings } from '@cf/utility/utilityFunctions'

const stringsRoot = {
  confirm_email_updates:
    'Hi there! Would you like to receive emails about updates to CourseFlow? You can always change your mind by viewing your profile.',
  unsupported_device:
    'Your device is not supported. Please use a laptop or desktop for the best experience.',
  product_updates_agree: 'I want to receive product updates emails',
  notifications: 'Notifications',
  home: 'Home',
  my_library: 'My library',
  explore: 'Explore',
  my_classrooms: 'My classrooms',
  favourites: 'Favourites',
  see_all: 'See all',
  view_all: 'View all',
  help_support: 'Help and Support',
  cancel: 'Cancel',
  password_reset: 'Password reset',
  password_reset_msg:
    'By choosing to reset your password, you will be directed to the SALTISE lobby and will have to navigate to the myDALITE application to set a new password.',
  notification_settings: 'Notification settings',
  sign_out: 'Sign out',
  profile: 'Profile',
  project: 'Project',
  program: 'Program',
  course: 'Course',
  activity: 'Activity',
  delete: 'Delete',
  show_notifications_menu: 'Show notifications menu',
  notification_options: 'Notification options',
  mark_as_read: 'Mark as read',
  mark_all_as_read: 'Mark all as read',
  no_notifications_yet: 'You have no notifications yet.',
  profile_settings: 'Profile settings',
  update_profile: 'Update profile',
  update_profile_success: 'User details updated!',
  workflow_archive_success: 'The Workflow has been archived',
  project_archive_success: 'The Project has been archived',
  project_archive_failure: 'There was an error archiving your project',
  workflow_archive_failure: 'There was an error archiving your workflow',
  workflow_unarchive_failure: 'There was an error unarchiving your workflow',
  project_unarchive_failure: 'There was an error unarchiving your project',
  project_unarchive_success: 'The Project has been unarchived',
  workflow_unarchive_success: 'The Workflow has been unarchived'
}

export default wrapLeafStrings<typeof stringsRoot>(stringsRoot)
