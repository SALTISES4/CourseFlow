import type { LocaleResourceShape } from '../../resourceShape'
import type profile from '../en-CA/profile'

const profileFr = {
  title: 'Paramètres du profil',
  fields: {
    email: 'Courriel / nom d’utilisateur',
    firstName: 'Prénom',
    lastName: 'Nom de famille',
    language: 'Préférences linguistiques'
  },
  validation: {
    firstNameRequired: 'Le prénom est requis',
    firstNameMax: 'Le prénom est limité à {{count}} caractères',
    lastNameRequired: 'Le nom de famille est requis',
    lastNameMax: 'Le nom de famille est limité à {{count}} caractères',
    languageRequired: 'La langue est requise'
  },
  actions: {
    update: 'Mettre à jour le profil'
  },
  messages: {
    updated: 'Les paramètres de votre profil ont été mis à jour',
    updateFailed:
      'Un problème est survenu et les paramètres de votre profil n’ont pas été mis à jour'
  },
  password: {
    title: 'Réinitialisation du mot de passe',
    fields: {
      current: 'Mot de passe actuel',
      new: 'Nouveau mot de passe',
      confirm: 'Confirmer le nouveau mot de passe'
    },
    actions: {
      reset: 'Réinitialiser le mot de passe'
    },
    validation: {
      currentRequired: 'Le mot de passe actuel est requis',
      currentIncorrect: 'Le mot de passe actuel est incorrect',
      newRequired: 'Le nouveau mot de passe est requis',
      confirmRequired: 'La confirmation du nouveau mot de passe est requise',
      newMatchesCurrent:
        'Le nouveau mot de passe doit être différent du mot de passe actuel',
      mismatch: 'Les mots de passe ne correspondent pas',
      strength:
        'Votre mot de passe doit contenir au moins 12 caractères ainsi qu’une combinaison de chiffres, de lettres et de symboles'
    },
    messages: {
      updated: 'Votre mot de passe a été réinitialisé',
      updateFailed:
        'Un problème est survenu et votre mot de passe n’a pas été réinitialisé'
    }
  }
} as const satisfies LocaleResourceShape<typeof profile>

export default profileFr
