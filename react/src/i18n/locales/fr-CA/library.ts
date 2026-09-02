import type { LocaleResourceShape } from '../../resourceShape'
import type library from '../en-CA/library'

const libraryFr = {
  sort: {
    alphabetical: 'A – Z',
    dateCreated: 'Date de création'
  },
  filters: {
    ownership: 'Propriété',
    owned: 'Mes contenus',
    shared: 'Partagés avec moi',
    discipline: 'Discipline',
    findDiscipline: 'Rechercher une discipline',
    type: 'Type',
    projects: 'Projets',
    workflows: 'Flux de travail',
    workflowType: 'Type de flux de travail',
    activity: 'Activité',
    course: 'Cours',
    program: 'Programme',
    templates: 'Modèles',
    favourites: 'Favoris',
    archive: 'Archives',
    search: 'Rechercher'
  },
  results: {
    summary_one: 'Affichage de {{range}} résultat sur {{count}}',
    summary_other: 'Affichage de {{range}} résultats sur {{count}}',
    none: 'Aucun résultat',
    notFound: 'Le contenu recherché est introuvable.',
    loadFailed: 'La bibliothèque n’a pas pu être chargée.',
    searchFailed: 'Les suggestions de recherche n’ont pas pu être chargées.',
    seeAll: '+ Tout afficher'
  },
  cards: {
    type: {
      project: 'Projet',
      program: 'Programme',
      course: 'Cours',
      activity: 'Activité',
      task: 'Tâche',
      workflow: 'Flux de travail'
    },
    strategy: 'stratégie',
    template: 'Modèle',
    workflowCount_one: '{{count}} flux de travail',
    workflowCount_other: '{{count}} flux de travail'
  }
} as const satisfies LocaleResourceShape<typeof library>

export default libraryFr
