import type { LocaleResourceShape } from '../../resourceShape'
import type workflow from '../en-CA/workflow'

const workflowFr = {
  type: {
    program: 'Programme', activity: 'Activité', course: 'Cours', task: 'Tâche', workflow: 'Flux de travail',
    programLower: 'programme', activityLower: 'activité', courseLower: 'cours', taskLower: 'tâche', workflowLower: 'flux de travail'
  },
  tabs: { overview: 'Aperçu', workflow: 'Flux de travail', outcomes: 'Résultats' },
  overview: {
    description: 'Description', emptyValue: '—', disciplines: 'Disciplines', noDisciplines: 'Aucune discipline.',
    createdOn: 'Créé le', permissions: 'Autorisations', copyPublicLink: 'Copier le lien public',
    removePublicLink: 'Supprimer le lien public', generatePublicLink: 'Générer un lien public'
  },
  metadata: {
    time: 'Durée', calculateTime: 'Calculer automatiquement la durée', credits: 'Crédits',
    calculateCredits: 'Calculer automatiquement les crédits', ponderation: 'Pondération',
    calculatePonderation: 'Calculer automatiquement la pondération',
    ponderationMismatch: 'Le total des heures de pondération ne correspond pas à la durée du {{workflowType}}.',
    classification: 'Classification', calculateClassification: 'Calculer automatiquement la classification',
    classificationMismatch: 'Le total des heures de classification ne correspond pas à la durée du programme.', code: 'Code',
    theory: 'Théorie', practical: 'Pratique', individual: 'Individuel', generalTime: 'Formation générale', specificTime: 'Formation spécifique'
  },
  messages: {
    metadataSaveFailed: 'Les métadonnées du flux de travail n’ont pas pu être enregistrées.',
    publicLinkEnabled: 'Le lien public a été activé.', publicLinkRemoved: 'Le lien public a été supprimé.',
    publicLinkUpdateFailed: 'Le lien public n’a pas pu être mis à jour.', publicLinkCopied: 'Le lien public a été copié.',
    publicLinkCopyFailed: 'Le lien public n’a pas pu être copié.', roleUpdated: 'Le rôle de la personne collaboratrice a été mis à jour.',
    roleUpdateFailed: 'Le rôle de la personne collaboratrice n’a pas pu être mis à jour.', commentDeleted: 'Votre commentaire a été supprimé.',
    commentDeleteFailed: 'Votre commentaire n’a pas pu être supprimé.', copied: 'Le contenu {{workflowType}} a été copié.',
    copyFailed: 'Le contenu {{workflowType}} n’a pas pu être copié.', updated: 'Votre contenu {{workflowType}} a été mis à jour.',
    updateFailed: 'Votre contenu {{workflowType}} n’a pas pu être mis à jour.'
  },
  permissions: { owner: 'Propriétaire', removeContributor: 'Retirer la personne collaboratrice', addUser: 'Ajouter une personne de CourseFlow' },
  legend: { show: 'Afficher la légende', title: 'Légende', tasks: 'Tâches', contexts: 'Contextes' },
  outcomes: {
    howToTitle: 'Comment utiliser les résultats',
    howToHelp: 'Dans cette vue, vous pouvez ajouter et modifier les résultats de ce flux de travail. Une fois ajoutés, les résultats peuvent être associés aux nœuds depuis l’onglet « Flux de travail » en les faisant glisser de la barre latérale droite vers les nœuds.',
    add: 'Ajouter un résultat', addPlural: 'Ajouter des résultats', title: 'Résultats',
    sidebarHelp: 'Faites glisser les résultats des flux parents pour les associer aux résultats du flux actuel. Sélectionnez un résultat pour mettre en évidence les nœuds pertinents.',
    edit: 'Modifier les résultats', editOne: 'Modifier le résultat',
    addRequired: 'Ajoutez des résultats avant de les associer aux nœuds et aux résultats du flux actuel.',
    empty: 'Ce {{workflowType}} ne contient actuellement aucun résultat. Ouvrez la vue des résultats pour en ajouter.',
    fromParents: 'Résultats des flux de travail parents', untitled: 'Résultat sans titre', untagged: 'Sans étiquette',
    insertSibling: 'Insérer au même niveau', insertChild: 'Insérer un enfant'
  },
  comments: {
    title: 'Commentaires', selectItem: 'Sélectionnez un élément pour consulter ou ajouter des commentaires.',
    unavailable: 'Les commentaires ne sont pas encore disponibles pour cet élément.', loading: 'Chargement des commentaires',
    loadFailed: 'Les commentaires n’ont pas pu être chargés.', addPlaceholder: 'Ajouter un commentaire', add: 'Ajouter le commentaire'
  },
  sidebar: {
    tabLabel: 'Onglet {{tab}}',
    tabs: { edit: 'Modifier', add: 'Ajouter', comments: 'Commentaires', outcomes: 'Résultats', related: 'Connexions' },
    unavailableTitle: 'Non disponible',
    unsupportedEditor: 'L’éditeur de type {{type}} n’est pas encore pris en charge.'
  },
  richText: {
    description: 'Description', toolbar: 'Mise en forme de la description', bold: 'Gras', italic: 'Italique',
    underline: 'Souligné', superscript: 'Exposant', subscript: 'Indice', bulletedList: 'Liste à puces',
    numberedList: 'Liste numérotée', list: 'Liste', link: 'Lien', linkUrl: 'URL du lien'
  },
  wizard: {
    selectProject: 'Sélectionner un projet', selectType: 'Sélectionner le type de {{workflowType}}',
    create: 'Créer un {{workflowType}}', createFromTemplate: 'Créer un {{workflowType}} à partir d’un modèle',
    createBlank: 'Créer un {{workflowType}} vide', created: 'Votre {{workflowType}} a été créé.',
    createFailed: 'Un problème est survenu et votre {{workflowType}} n’a pas été créé.',
    previousStep: 'Étape précédente', nextStep: 'Étape suivante', blank: '{{workflowType}} vide',
    recommendedAdvanced: 'Recommandé aux utilisateurs avancés',
    blankDescription: 'Créez votre propre structure de {{workflowType}} personnalisée', fromTemplate: 'À partir d’un modèle',
    recommendedBeginners: 'Recommandé aux débutants',
    templateDescription: 'Commencez rapidement avec un modèle fondé sur les pratiques exemplaires'
  },
  unavailableView: 'Cette vue n’est pas disponible.',
  related: {
    appearsIn: 'Apparaît dans', contains: 'Contient', returnTo: 'Retourner à', returnToEditable: 'Retourner au flux de travail modifiable',
    multipleLinksWarning: 'Ce flux de travail est lié à plusieurs nœuds. Des résultats de différents flux parents ou des résultats en double peuvent apparaître.',
    unlinkOutcome: 'Dissocier le résultat'
  },
  addPanel: {
    title: 'Ajouter au flux de travail', insertMode: 'Mode d’insertion',
    insertModeHelp: 'Le mode rangée place les nœuds en séquence verticale. Le mode colonne permet de placer plusieurs nœuds côte à côte. Le mode manuel vous invite à choisir la disposition de chaque nouveau nœud.',
    manual: 'Manuel', row: 'Rangée', column: 'Colonne', nodeCategories: 'Catégories de nœuds', customNodeCategory: 'Catégorie de nœuds personnalisée'
  },
  edit: {
    node: 'Modifier le nœud', nodeLink: 'Modifier le lien du nœud', nodeCategory: 'Modifier la catégorie de nœuds',
    section: 'Modifier la section', title: 'Titre', titleRequired: 'Le titre est obligatoire', description: 'Description',
    context: 'Contexte', type: 'Type', time: 'Durée', credits: 'Crédits', ponderation: 'Pondération',
    theoryHours: 'H théoriques', practiceHours: 'H pratiques', individualHours: 'H individuelles',
    specificEducation: 'Formation spécifique', tags: 'Étiquettes', sectionLabel: 'Section', textPosition: 'Position du texte',
    dashedLine: 'Ligne pointillée'
  },
  linkAction: {
    linkCourse: 'Lier un cours', removeCourse: 'Dissocier le cours', linkActivity: 'Lier une activité',
    removeActivity: 'Dissocier l’activité', linkWorkflow: 'Lier un flux de travail', removeWorkflow: 'Dissocier le flux de travail'
  },
  linked: { course: 'Cours lié', activity: 'Activité liée', workflow: 'Flux de travail lié', untitledNode: 'Nœud sans titre' },
  graph: {
    untitledNodeCategory: 'Catégorie de nœuds sans titre',
    emptySection: 'Faites glisser des nœuds depuis la barre latérale ou une autre section pour les ajouter ici.',
    insertRight: 'Insérer à droite', insertRow: 'Insérer une rangée', keepSameColumn: 'Conserver dans la même colonne',
    insertNodeBelow: 'Insérer un nœud en dessous', duplicateNodeBelow: 'Dupliquer le nœud en dessous', deleteNode: 'Supprimer le nœud',
    insertSectionBelow: 'Insérer une section en dessous', duplicateSectionBelow: 'Dupliquer la section en dessous', deleteSection: 'Supprimer la section'
  },
  systemLabels: {
    channel: {
      activity_out_of_class_instructor: 'Hors classe (personnel enseignant)',
      activity_out_of_class_students: 'Hors classe (personnes étudiantes)',
      activity_in_class_instructor: 'En classe (personnel enseignant)',
      activity_in_class_students: 'En classe (personnes étudiantes)',
      course_preparation: 'Préparation', course_lesson: 'Leçon', course_artifact: 'Production',
      course_assessment: 'Évaluation', custom_node_category: 'Catégorie de nœuds personnalisée'
    },
    copy: '{{title}} (copie)', copyNumbered: '{{title}} (copie {{count}})',
    sectionNumber: 'Section {{number}}', expandSection: 'Développer la section', collapseSection: 'Réduire la section'
  },
  menu: {
    edit: 'Modifier le flux de travail', sharing: 'Partage', export: 'Exporter', importOutcomes: 'Importer des résultats',
    importNodes: 'Importer des nœuds', archive: 'Archiver {{workflowType}}', copy: 'Copier {{workflowType}}',
    restore: 'Restaurer le flux de travail', permanentlyDelete: 'Supprimer définitivement le flux de travail',
    viewSettings: 'Paramètres d’affichage', expandSections: 'Développer toutes les sections', expandNodes: 'Développer tous les nœuds',
    expandOutcomes: 'Développer tous les résultats', jumpTo: 'Aller à', notConnected: 'Non connecté', onlineUsers: 'Utilisateurs en ligne',
    deleteConfirmation: 'Voulez-vous vraiment supprimer définitivement ce flux de travail?'
  },
  searchProjects: {
    loadFailed: 'Les projets n’ont pas pu être chargés.', noEligibleTitle: 'Vous n’êtes propriétaire ou éditeur d’aucun projet',
    noEligibleDescription: 'Tous les programmes, cours et activités appartiennent à des projets. Créez un projet ou demandez à un propriétaire de projet de vous ajouter comme éditeur avant de créer un flux de travail.',
    placeholder: 'Rechercher dans les projets…', noResults: 'Aucun résultat'
  },
  linkDialog: {
    courseTitle: 'Lier un cours', activityTitle: 'Lier une activité', search: 'Rechercher',
    loadFailed: 'Les flux de travail n’ont pas pu être chargés.', noExactMatches: 'Aucune correspondance exacte.',
    noCourse: 'Aucun cours trouvé', noActivity: 'Aucune activité trouvée', linkCourse: 'Lier le cours', linkActivity: 'Lier l’activité'
  },
  copyDialog: { title: 'Copier {{workflowType}}', loadFailed: 'Le flux de travail n’a pas pu être chargé.', submit: 'Copier {{workflowType}}' },
  form: {
    editTitle: 'Modifier {{workflowType}}', update: 'Mettre à jour {{workflowType}}', title: 'Titre',
    titleForType: 'Titre du {{workflowType}}', titleRequired: 'Le titre est obligatoire',
    titleMax: 'Le titre ne peut pas dépasser {{count}} caractères', description: 'Description',
    descriptionForType: 'Description du {{workflowType}}', copyTitle: '{{title}} (copie)'
  },
  deleteSection: {
    title: 'Vous êtes sur le point de supprimer une section',
    warning: 'La suppression de cette section supprimera également tous ses nœuds. Voulez-vous vraiment continuer?', submit: 'Supprimer la section'
  },
  deleteNodeCategory: {
    title: 'Vous êtes sur le point de supprimer une catégorie de nœuds',
    warning: 'La suppression de cette catégorie supprimera également tous les nœuds associés. Voulez-vous vraiment continuer?',
    submit: 'Supprimer la catégorie de nœuds'
  }
} as const satisfies LocaleResourceShape<typeof workflow>

export default workflowFr
