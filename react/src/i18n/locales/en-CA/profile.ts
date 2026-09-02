const profile = {
  title: 'Profile settings',
  fields: {
    email: 'Email / Username',
    firstName: 'First name',
    lastName: 'Last name',
    language: 'Language preferences'
  },
  validation: {
    firstNameRequired: 'First name is required',
    firstNameMax: 'First name is limited to {{count}} characters',
    lastNameRequired: 'Last name is required',
    lastNameMax: 'Last name is limited to {{count}} characters',
    languageRequired: 'Language is required'
  },
  actions: {
    update: 'Update profile'
  },
  messages: {
    updated: 'Your profile settings have been updated',
    updateFailed:
      'We encountered an issue and your profile settings have not been updated'
  },
  password: {
    title: 'Password reset',
    fields: {
      current: 'Current password',
      new: 'New password',
      confirm: 'Confirm new password'
    },
    actions: {
      reset: 'Reset password'
    },
    validation: {
      currentRequired: 'Current password is required',
      currentIncorrect: 'Current password is incorrect',
      newRequired: 'New password is required',
      confirmRequired: 'Confirm new password is required',
      newMatchesCurrent:
        'New password must be different from your current password',
      mismatch: 'Passwords do not match',
      strength:
        'Your password must contain at least 12 characters and include a mix of numbers, letters and symbols'
    },
    messages: {
      updated: 'Your password has been successfully reset',
      updateFailed: 'We encountered an issue and your password was not reset'
    }
  }
} as const

export default profile
