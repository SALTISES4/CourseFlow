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
    heading: 'Login to your CourseFlow account',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot your password?',
    loggingIn: 'Logging in…',
    submit: 'Login',
    noAccount: 'Don’t have an account?',
    register: 'Register'
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
    invalidCredentials: 'The email or password is incorrect.',
    emailAlreadyRegistered: 'An account already exists for this email address.',
    registrationFieldsRequired: 'All fields are required.',
    requestFailed: 'Authentication could not be completed. Please try again.'
  }
} as const

export default auth
