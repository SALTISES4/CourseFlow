import authEn from './locales/en-CA/auth'
import commonEn from './locales/en-CA/common'
import homeEn from './locales/en-CA/home'
import libraryEn from './locales/en-CA/library'
import notificationsEn from './locales/en-CA/notifications'
import profileEn from './locales/en-CA/profile'
import projectEn from './locales/en-CA/project'
import referenceEn from './locales/en-CA/reference'
import settingsEn from './locales/en-CA/settings'
import workflowEn from './locales/en-CA/workflow'
import workspaceEn from './locales/en-CA/workspace'
import authFr from './locales/fr-CA/auth'
import commonFr from './locales/fr-CA/common'
import homeFr from './locales/fr-CA/home'
import libraryFr from './locales/fr-CA/library'
import notificationsFr from './locales/fr-CA/notifications'
import profileFr from './locales/fr-CA/profile'
import projectFr from './locales/fr-CA/project'
import referenceFr from './locales/fr-CA/reference'
import settingsFr from './locales/fr-CA/settings'
import workflowFr from './locales/fr-CA/workflow'
import workspaceFr from './locales/fr-CA/workspace'

export const defaultNamespace = 'common'

export const resources = {
  'en-CA': {
    common: commonEn,
    home: homeEn,
    library: libraryEn,
    notifications: notificationsEn,
    auth: authEn,
    profile: profileEn,
    project: projectEn,
    reference: referenceEn,
    settings: settingsEn,
    workflow: workflowEn,
    workspace: workspaceEn
  },
  'fr-CA': {
    common: commonFr,
    home: homeFr,
    library: libraryFr,
    notifications: notificationsFr,
    auth: authFr,
    profile: profileFr,
    project: projectFr,
    reference: referenceFr,
    settings: settingsFr,
    workflow: workflowFr,
    workspace: workspaceFr
  }
} as const

export type TranslationNamespace = keyof (typeof resources)['en-CA']
