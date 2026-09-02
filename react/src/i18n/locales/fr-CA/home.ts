import type { LocaleResourceShape } from '../../resourceShape'
import type home from '../en-CA/home'

const homeFr = {
  sections: {
    recentProjects: 'Projets récents',
    viewAllProjects: 'Voir tous les projets',
    exploreTemplates: 'Explorer les modèles',
    getStartedTemplates: 'Commencer avec des modèles',
    viewAllTemplates: 'Voir tous les modèles'
  },
  templates: {
    howToTitle: 'Comment utiliser les modèles',
    howToHelp:
      'Les modèles offrent une structure préétablie fondée sur les meilleures pratiques pédagogiques afin que vous n’ayez pas à partir de zéro!'
  },
  welcome: {
    closeLabel: 'Fermer le message de bienvenue',
    title: 'Bienvenue dans CourseFlow',
    prompt:
      'Parlez-nous de vos objectifs afin que nous puissions vous aider à démarrer.',
    createActivity: 'Je veux créer une activité',
    createCourse: 'Je veux créer un cours',
    createProgram: 'Je veux créer un programme'
  }
} as const satisfies LocaleResourceShape<typeof home>

export default homeFr
