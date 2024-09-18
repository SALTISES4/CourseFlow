//Removes the specified comment from the object
import { apiPaths } from '@cf/router/apiRoutes'
import { API_POST } from '@XMLHTTP/CallWrapper'
import { CommentsForObjectQueryResp, EmptyPostResp } from '@XMLHTTP/types/query'

//Get the comments for a particular object
export function getCommentsForObjectQuery(
  objectId: number,
  objectType: any,
  callBackFunction = (_data: CommentsForObjectQueryResp) =>
    console.log('success')
) {
  const url = apiPaths.json_api.comment.list_by_object
  API_POST(url, {
    objectId: objectId,
    objectType: objectType
  }).then((response: CommentsForObjectQueryResp) => {
    callBackFunction(response)
  })
}
//add a comment to an object
export function addComment(
  objectId,
  objectType,
  text,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  const url = apiPaths.json_api.comment.create
  API_POST(url, {
    objectId: objectId,
    objectType: objectType,
    text: text
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}

export function removeComment(
  objectId,
  objectType,
  commentPk,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  const url = apiPaths.json_api.comment.delete
  API_POST(url, {
    objectId: objectId,
    commentPk: commentPk,
    objectType: objectType
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}

//Removes all comments from the object
export function removeAllComments(
  objectId,
  objectType,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  const url = apiPaths.json_api.comment.delete_all
  API_POST(url, {
    objectId: objectId,
    objectType: objectType
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}
