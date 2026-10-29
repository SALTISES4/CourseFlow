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
    heading: 'Connexion à CourseFlow',
    email: 'Courriel',
    password: 'Mot de passe',
    forgotPassword: 'Mot de passe oublié?',
    loggingIn: 'Connexion…',
    submit: 'Se connecter',
    noAccount: 'Vous n’avez pas de compte?',
    register: 'S’inscrire',
    validation: {
      emailRequired: 'Le courriel est requis',
      invalidEmailFormat: 'Format de courriel invalide',
      passwordRequired: 'Le mot de passe est requis'
    }
  },
  registerForm: {
    firstName: 'Prénom',
    lastName: 'Nom de famille'
  },
  resetPassword: {
    heading: 'Réinitialisez votre mot de passe CourseFlow',
    submit: 'Réinitialiser le mot de passe',
    request: {
      submitting: 'Envoi des instructions…',
      validation: {
        emailRequired: 'Le courriel est requis',
        invalidEmailFormat: 'Format de courriel invalide'
      },
      messages: {
        sent: 'Si l’adresse courriel correspond à un compte actif, vous recevrez sous peu les instructions pour réinitialiser votre mot de passe.',
        failed:
          'Un problème est survenu et votre demande de réinitialisation du mot de passe n’a pas pu être envoyée'
      }
    },
    confirm: {
      fields: {
        password: 'Nouveau mot de passe',
        confirmPassword: 'Confirmer le nouveau mot de passe'
      },
      passwordGuidelines:
        'Votre mot de passe doit contenir au moins 12 caractères ainsi qu’une combinaison de chiffres, de lettres et de symboles',
      validation: {
        passwordRequired: 'Le nouveau mot de passe est requis',
        confirmRequired: 'La confirmation du nouveau mot de passe est requise',
        mismatch: 'Les mots de passe ne correspondent pas'
      },
      validating: 'Validation du lien de réinitialisation du mot de passe',
      submitting: 'Réinitialisation du mot de passe…',
      retry: 'Réessayer',
      messages: {
        succeeded: 'Votre mot de passe a été réinitialisé',
        failed:
          'Un problème est survenu et votre mot de passe n’a pas été réinitialisé',
        validationFailed:
          'Un problème est survenu et votre lien de réinitialisation du mot de passe n’a pas pu être vérifié'
      }
    },
    invalidLink: {
      heading: 'Lien expiré ou invalide',
      explanation:
        'Pour votre sécurité, les liens de réinitialisation du mot de passe expirent après 24 heures et ne peuvent être utilisés qu’une seule fois.',
      requestNew: 'Demander un nouveau lien'
    }
  },
  errors: {
    invalidCredentials: 'L’adresse courriel ou le mot de passe est incorrect.',
    emailAlreadyRegistered:
      'Un compte existe déjà pour cette adresse courriel.',
    registrationFieldsRequired: 'Tous les champs sont requis.',
    requestFailed: 'L’authentification a échoué. Veuillez réessayer.'
  }
} as const satisfies LocaleResourceShape<typeof auth>

export default authFr
