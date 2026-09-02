import { UserSummaryOut } from '@cf/api/gen'
import {
  normalizeLocale,
  toApiLanguagePreference
} from '@cf/i18n/config'
import type { EUser } from '@XMLHTTP/types/entity'

/**
 * Maps v2 API user summary into legacy EUser shape for existing consumers.
 * */
export function mapCurrentUserToEUser(u: UserSummaryOut): EUser {
  const firstName = u.firstName ?? ''
  const lastName = u.lastName ?? ''
  return {
    uuid: u.uuid,
    username: u.email,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim() || u.email,
    email: u.email,
    language: toApiLanguagePreference(
      normalizeLocale(u.languagePreference)
    )
  }
}
