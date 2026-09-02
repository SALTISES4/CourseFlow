import type { LocaleResourceShape } from '../../resourceShape'
import type notifications from '../en-CA/notifications'

const notificationsFr = {
  title: 'Notifications',
  empty: 'Vous n’avez pas encore de notifications.',
  markAllAsRead: 'Tout marquer comme lu',
  markAsRead: 'Marquer comme lu',
  showMenu: 'Afficher le menu des notifications',
  options: 'Options de notification',
  loadFailed: 'Les notifications n’ont pas pu être chargées.',
  messageUnavailable: 'Cette notification n’est pas disponible.',
  messages: {
    'project.shared': 'Le projet « {{projectTitle}} » a été partagé avec vous.'
  }
} as const satisfies LocaleResourceShape<typeof notifications>

export default notificationsFr
