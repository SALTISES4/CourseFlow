import type { LocaleResourceShape } from '../../resourceShape'
import type common from '../en-CA/common'

const commonFr = {
  actions: {
    add: 'Ajouter',
    cancel: 'Annuler',
    clear: 'Effacer',
    close: 'Fermer',
    confirm: 'Confirmer',
    continue: 'Continuer',
    delete: 'Supprimer',
    duplicate: 'Dupliquer',
    remove: 'Retirer',
    save: 'Enregistrer',
    update: 'Mettre à jour'
  },
  labels: {
    all: 'Tout',
    archived: 'Archivé',
    close: 'Fermer',
    deletedSuffix: 'supprimé',
    favourite: 'Favori',
    filter: 'Filtrer',
    find: 'Rechercher',
    none: 'Aucun',
    sort: 'Trier',
    untitled: 'Sans titre'
  },
  duration: { days: 'Jours', hours: 'Heures' },
  navigation: {
    home: 'Accueil',
    myLibrary: 'Ma bibliothèque',
    explore: 'Explorer',
    favourites: 'Favoris',
    viewAll: 'Tout afficher',
    helpSupport: 'Aide et soutien',
    collapseSidebar: 'Réduire la barre latérale',
    profile: 'Profil',
    passwordReset: 'Réinitialisation du mot de passe',
    notificationSettings: 'Paramètres de notification',
    signOut: 'Se déconnecter',
    addMenu: 'Menu d’ajout',
    accountMenu: 'Compte de la personne connectée'
  },
  favourites: {
    added: 'Ajouté à vos favoris.',
    removed: 'Retiré de vos favoris.',
    updateFailed: 'Le statut de favori n’a pas pu être mis à jour.'
  },
  cards: {
    ownedBy: 'Propriété de {{name}}',
    linkedWorkflowWarning: 'Lier le même flux de travail à plusieurs nœuds peut nuire à la lisibilité lorsque les résultats des flux parents et enfants sont associés.',
    alreadyInUse: 'Déjà utilisé'
  },
  lifecycle: {
    restored: 'Votre {{object}} a été restauré.',
    parentRestored: 'Votre projet a été restauré.',
    permanentlyDeleted: 'Votre {{object}} a été supprimé définitivement.',
    restoreProject: 'Restaurer le projet',
    restore: 'Restaurer',
    deletePermanently: 'Supprimer définitivement',
    restoreParentTitle: 'Restaurer le projet parent',
    permanentlyDeleteTitle: 'Supprimer définitivement {{object}}',
    restoreParentWarning: 'Ce flux de travail appartient à un projet archivé. Restaurer le projet et tous ses flux de travail?',
    permanentlyDeleteWarning: 'Ce {{object}} sera supprimé définitivement et ne pourra pas être récupéré.',
    deleteObject: 'Supprimer {{object}}',
    object: { project: 'projet', workflow: 'flux de travail' }
  },
  loading: 'Chargement…',
  language: {
    english: 'Anglais',
    french: 'Français'
  },
  errors: {
    unexpected: 'Une erreur est survenue. Veuillez réessayer.',
    requestFailed: 'La demande n’a pas pu être traitée.',
    routeFailed: 'Cette page n’a pas pu être affichée.'
  },
  fileUpload: {
    clickToUpload: 'Cliquez pour téléverser',
    dragAndDrop: 'ou glissez-déposez',
    removeFile: 'Retirer le fichier',
    uploadFailed: 'Échec du téléversement',
    fileTooLarge: 'Fichier trop volumineux',
    fileTooSmall: 'Fichier trop petit',
    invalidType: 'Type de fichier non pris en charge',
    tooManyFiles: 'Trop de fichiers',
    rejected: 'Le fichier n’a pas pu être accepté',
    fileSize: '{{size}} {{unit}}',
    units: {
      kilobytes: 'Ko',
      megabytes: 'Mo'
    },
    complete: 'Terminé',
    loading: 'Chargement',
    failed: 'Échec'
  },
  messages: {
    success: 'Opération réussie!'
  },
  access: {
    projectArchived: 'Ce projet a été archivé.',
    workflowArchived: 'Ce flux de travail a été archivé.',
    projectDenied: 'Vous n’avez pas accès à ce projet.',
    workflowDenied: 'Vous n’avez pas accès à ce flux de travail.'
  },
  examples: {
    greeting: 'Bonjour, {{name}}',
    selectedItem_one: '{{count}} élément sélectionné',
    selectedItem_other: '{{count}} éléments sélectionnés'
  }
} as const satisfies LocaleResourceShape<typeof common>

export default commonFr
