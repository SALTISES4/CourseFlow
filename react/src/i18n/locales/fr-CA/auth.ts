import type { LocaleResourceShape } from '../../resourceShape'
import type auth from '../en-CA/auth'

const authFr = {
  session: {
    unableToVerify: 'Impossible de vérifier la session'
  },
  login: {
    failed: 'Échec de la connexion'
  },
  registration: {
    failed: 'Échec de l’inscription',
    heading: 'Créez votre compte CourseFlow',
    creating: 'Création du compte…',
    submit: 'S’inscrire',
    backToLogin: 'Retour à'
  },
  loginForm: {
    heading: 'Connectez-vous à votre compte CourseFlow',
    email: 'Courriel',
    password: 'Mot de passe',
    forgotPassword: 'Mot de passe oublié?',
    loggingIn: 'Connexion…',
    submit: 'Se connecter',
    noAccount: 'Vous n’avez pas de compte?',
    register: 'S’inscrire'
  },
  registerForm: {
    firstName: 'Prénom',
    lastName: 'Nom de famille'
  },
  resetPassword: {
    heading: 'Réinitialisez votre mot de passe CourseFlow',
    submit: 'Réinitialiser le mot de passe'
  },
  errors: {
    invalidCredentials: 'L’adresse courriel ou le mot de passe est incorrect.',
    emailAlreadyRegistered: 'Un compte existe déjà pour cette adresse courriel.',
    registrationFieldsRequired: 'Tous les champs sont requis.',
    requestFailed: 'L’authentification a échoué. Veuillez réessayer.'
  }
} as const satisfies LocaleResourceShape<typeof auth>

export default authFr
