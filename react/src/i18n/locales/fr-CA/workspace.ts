import type { LocaleResourceShape } from '../../resourceShape'
import type workspace from '../en-CA/workspace'

const workspaceFr = {
  roles: { editor: 'Éditeur', commenter: 'Commentateur', viewer: 'Lecteur' },
  contributor: {
    added: 'La personne collaboratrice a été ajoutée à votre projet.',
    addFailed: 'La personne collaboratrice n’a pas pu être ajoutée à votre projet.',
    removed: 'La personne collaboratrice a été retirée de votre projet.',
    removeFailed: 'La personne collaboratrice n’a pas pu être retirée de votre projet.',
    addTitle: 'Ajouter une personne collaboratrice', users: 'Utilisateurs de CourseFlow', role: 'Rôle',
    removeTitle: 'Retirer cette personne?', removeConfirmation: 'Voulez-vous vraiment retirer {{name}}?'
  },
  lifecycle: {
    object: { project: 'projet', workflow: 'flux de travail' },
    archiveTitle: 'Archiver le {{object}}',
    archiveWarning: 'Une fois votre {{object}} archivé, il ne peut plus être ouvert depuis l’espace de travail. Vous pouvez le restaurer à partir des éléments archivés de votre bibliothèque.',
    archiveAction: 'Archiver le {{object}}',
    archiveSuccess: 'Le {{object}} a été archivé.',
    restoreTitle: 'Restaurer le {{object}}',
    restoreQuestion: 'Voulez-vous restaurer votre {{object}}?',
    restoreAction: 'Restaurer le {{object}}',
    restoreSuccess: 'Le {{object}} a été restauré.'
  }
} as const satisfies LocaleResourceShape<typeof workspace>

export default workspaceFr
