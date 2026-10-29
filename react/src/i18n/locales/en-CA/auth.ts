const auth = {
  session: {
    unableToVerify: 'Unable to verify session'
  },
  login: {
    failed: 'Login failed'
  },
  registration: {
    failed: 'Registration failed',
    heading: 'Create your CourseFlow account',
    creating: 'Creating an account…',
    submit: 'Register',
    backToLogin: 'Back to'
  },
  loginForm: {
    heading: 'Login to CourseFlow',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot your password?',
    loggingIn: 'Logging in…',
    submit: 'Login',
    noAccount: "Don't have an account?",
    register: 'Register',
    validation: {
      emailRequired: 'Email is required',
      invalidEmailFormat: 'Invalid email format',
      passwordRequired: 'Password is required'
    }
  },
  registerForm: {
    firstName: 'First name',
    lastName: 'Last name'
  },
  resetPassword: {
    heading: 'Reset your CourseFlow password',
    submit: 'Reset password',
    request: {
      submitting: 'Sending reset instructions…',
      validation: {
        emailRequired: 'Email is required',
        invalidEmailFormat: 'Invalid email format'
      },
      messages: {
        sent: 'If the email address matches an active account, you will receive instructions to reset your password shortly.',
        failed:
          'We encountered an issue and your password reset request could not be sent'
      }
    },
    confirm: {
      fields: {
        password: 'New password',
        confirmPassword: 'Confirm new password'
      },
      passwordGuidelines:
        'Your password must contain at least 12 characters and include a mix of numbers, letters and symbols',
      validation: {
        passwordRequired: 'New password is required',
        confirmRequired: 'Confirm new password is required',
        mismatch: 'Passwords do not match'
      },
      validating: 'Validating password reset link',
      submitting: 'Resetting password…',
      retry: 'Try again',
      messages: {
        succeeded: 'Your password has been successfully reset',
        failed: 'We encountered an issue and your password was not reset',
        validationFailed:
          'We encountered an issue and could not verify your password reset link'
      }
    },
    invalidLink: {
      heading: 'Link expired or invalid',
      explanation:
        'For your security, password reset links expire after 24 hours and can only be used once.',
      requestNew: 'Request a new link'
    }
  },
  errors: {
    invalidCredentials:
      'The email or password you entered is incorrect. please check your details and try again.',
    emailAlreadyRegistered: 'An account already exists for this email address.',
    registrationFieldsRequired: 'All fields are required.',
    requestFailed: 'Authentication could not be completed. Please try again.'
  }
} as const

export default auth
