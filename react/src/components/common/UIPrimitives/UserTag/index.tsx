/**
 *  Get the little tag that sits in front of usernames signifying the role
 *  @todo move to component
 * @param userType
 */
import { _t } from '@cf/utility/Utility.class'

const UserTag = (userType) => {
  function permissionTranslate() {
    return {
      author: _t('Owner'),
      edit: _t('Editor'),
      comment: _t('Commenter'),
      view: _t('Viewer')
    }
  }

  return (
    <span className={'user-tag permission-' + userType}>
      {permissionTranslate()[userType]}
    </span>
  )
}

export default UserTag
