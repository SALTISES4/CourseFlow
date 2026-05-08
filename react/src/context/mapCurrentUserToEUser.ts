import type { CurrentUser } from '@cf/api/auth'
import type { EUser } from '@XMLHTTP/types/entity'

/** Maps v2 API user summary into legacy EUser shape for existing consumers. */
export function mapCurrentUserToEUser(u: CurrentUser): EUser {
  const firstName = u.firstName ?? ''
  const lastName = u.lastName ?? ''
  return {
    uuid: u.uuid,
    username: u.email,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim() || u.email,
    email: u.email,
    language: 'en'
  }
}
