import type { LocaleResourceShape } from '../../resourceShape'
import type project from '../en-CA/project'

const projectFr = {
  actions: {
    archive: 'Archiver le projet',
    copy: 'Copier le projet',
    create: 'Créer un projet',
    edit: 'Modifier le projet',
    export: 'Exporter',
    permanentlyDelete: 'Supprimer définitivement le projet',
    publish: 'Publier le projet',
    restore: 'Restaurer le projet',
    share: 'Partage',
    unpublish: 'Dépublier le projet',
    update: 'Mettre à jour le projet'
  },
  status: {
    archived: 'Archivé',
    currentPublic: 'Le projet est actuellement public',
    currentPrivate: 'Le projet est actuellement privé'
  },
  tabs: {
    overview: 'Aperçu',
    workflows: 'Flux de travail'
  },
  form: {
    title: 'Titre',
    titlePlaceholder: 'Titre du projet',
    description: 'Description',
    discipline: 'Discipline',
    titleRequired: 'Le titre du projet ne peut pas être vide',
    titleMax: 'Le titre du projet ne peut pas dépasser {{count}} caractères',
    firstProjectTitle: 'Commencez par créer un projet',
    firstProjectHelp:
      'Tous les flux de travail, qu’il s’agisse de programmes, de cours ou d’activités, appartiennent à des projets. Vous devez commencer par créer un projet avant de créer un flux de travail.'
  },
  overview: {
    description: 'Description',
    disciplines: 'Disciplines',
    contributors: 'Collaborateurs',
    emptyValue: '—',
    publishConfirmation:
      'La publication de ce projet rendra tous les flux de travail associés visibles à tous les utilisateurs de CourseFlow. Êtes-vous prêt à partager ce contenu?'
  },
  tags: {
    title: 'Étiquettes',
    addPlaceholder: 'Ajouter une étiquette'
  },
  messages: {
    created: 'Votre projet a été créé',
    createFailed: 'Un problème est survenu et votre projet n’a pas été créé',
    updated: 'Votre projet a été mis à jour',
    updateFailed: 'Un problème est survenu et votre projet n’a pas été mis à jour',
    published: 'Votre projet a été publié',
    publishFailed: 'Un problème est survenu et votre projet n’a pas été publié',
    unpublished: 'Votre projet a été dépublié',
    unpublishFailed: 'Un problème est survenu et votre projet n’a pas été dépublié'
  },
  errors: {
    notFound: 'Le projet n’existe pas',
    loadFailed: 'Le projet n’a pas pu être chargé.'
  },
  exportDialog: {
    title: 'Exporter {{projectType}}',
    type: 'Type d’exportation',
    format: 'Format d’exportation',
    unavailable: 'L’exportation n’est pas encore disponible.',
    objectType: {
      project: 'le projet',
      program: 'le programme',
      course: 'le cours',
      activity: 'l’activité'
    },
    options: {
      outcome: 'Résultats',
      node: 'Nœuds',
      framework: 'Structure du cours',
      matrix: 'Matrice de compétences',
      sobec: 'Validation SOBEC',
      excel: 'Excel',
      csv: 'CSV'
    }
  }
} as const satisfies LocaleResourceShape<typeof project>

export default projectFr
