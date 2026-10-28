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
    submit: 'Reset password'
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
