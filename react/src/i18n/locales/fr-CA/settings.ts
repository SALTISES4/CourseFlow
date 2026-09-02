import type { LocaleResourceShape } from '../../resourceShape'
import type settings from '../en-CA/settings'

const settingsFr = {
  notifications: {
    title: 'Paramètres de notification',
    productUpdates: 'Je souhaite recevoir les courriels de mise à jour du produit',
    updated: 'Vos paramètres de notification ont été mis à jour.',
    updateFailed: 'Vos paramètres de notification n’ont pas pu être mis à jour.'
  }
} as const satisfies LocaleResourceShape<typeof settings>

export default settingsFr
