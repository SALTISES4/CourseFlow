import * as Utility from '@cfUtility'
import * as React from 'react'
import { UsersForObjectQueryResp } from '@XMLHTTP/types/query'
import PublicIcon from '@mui/icons-material/Public'

type PropsType = {
  users: UsersForObjectQueryResp
  readOnly: boolean
  openShareDialog: () => void
}

const Users = ({ users, readOnly, openShareDialog }: PropsType) => {
  if (!users) return null

  // @todo users shape
  const { author, editors, commentors, viewers, published } = users

  if (!author) return null

  return (
    <>
      {published && (
        <div className="user-name">
          {Utility.getUserTag('view')}

          <PublicIcon />
          {window.gettext('All CourseFlow')}
        </div>
      )}

      <div className="users-group">
        <div className="user-name">
          {Utility.getUserTag('author')}
          {Utility.getUserDisplay(author)}
        </div>

        {editors
          .filter((user) => user.id !== author.id)
          .map((user) => (
            <div key={user.id} className="user-name">
              {Utility.getUserTag('edit')}
              {Utility.getUserDisplay(user)}
            </div>
          ))}

        {commentors.map((user) => (
          <div key={user.id} className="user-name">
            {Utility.getUserTag('comment')}
            {Utility.getUserDisplay(user)}
          </div>
        ))}

        {viewers.map((user) => (
          <div key={user.id} className="user-name">
            {Utility.getUserTag('view')}
            {Utility.getUserDisplay(user)}
          </div>
        ))}
      </div>

      {viewers.length + commentors.length + editors.length > 4 && (
        <div className="workflow-created">
          +{viewers.length + commentors.length + editors.length - 4}{' '}
          {window.gettext('more')}
        </div>
      )}

      {!readOnly && (
        <div
          className="user-name collapsed-text-show-more"
          onClick={openShareDialog}
        >
          {window.gettext('Modify')}
        </div>
      )}
    </>
  )
}

export default Users

// const Users = ({ users, readOnly, openShareDialog }: PropsType) => {
//   let users_group = []
//
//   if (!users) return null
//   const { author, editors, commentors, viewers, published } = users
//
//   if (!author) return null
//
//   if (published) {
//     users_group.push(
//       <div className="user-name">
//         {Utility.getUserTag('view')}
//         <span className="material-symbols-rounded">public</span>{' '}
//         {window.gettext('All CourseFlow')}
//       </div>
//     )
//   }
//
//   users_group.push([
//     <div className="user-name">
//       {Utility.getUserTag('author')}
//       {Utility.getUserDisplay(author)}
//     </div>,
//     editors
//       .filter((user) => user.id != author.id)
//       .map((user) => (
//         <div className="user-name">
//           {Utility.getUserTag('edit')}
//           {Utility.getUserDisplay(user)}
//         </div>
//       )),
//     commentors.map((user) => (
//       <div className="user-name">
//         {Utility.getUserTag('comment')}
//         {Utility.getUserDisplay(user)}
//       </div>
//     )),
//     viewers.map((user) => (
//       <div className="user-name">
//         {Utility.getUserTag('view')}
//         {Utility.getUserDisplay(user)}
//       </div>
//     ))
//   ])
//   users_group = users_group.flat(2)
//
//   const usersBlocks = [<div className="users-group">{users_group}</div>]
//   if (users_group.length > 4) {
//     usersBlocks.push(
//       <div className="workflow-created">
//         +{users_group.length - 4} {window.gettext('more')}
//       </div>
//     )
//   }
//   if (!readOnly)
//     usersBlocks.push(
//       <div
//         className="user-name collapsed-text-show-more"
//         onClick={openShareDialog}
//       >
//         {window.gettext('Modify')}
//       </div>
//     )
//   return usersBlocks
// }
