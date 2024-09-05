//Removes the specified comment from the object
import { VERB } from '@cf/types/enum'
import { API_POST } from '@XMLHTTP/CallWrapper'
import { CommentsForObjectQueryResp, EmptyPostResp } from '@XMLHTTP/types/query'

//Get the comments for a particular object
export function getCommentsForObjectQuery(
  objectId: number,
  objectType: any,
  callBackFunction = (_data: CommentsForObjectQueryResp) =>
    console.log('success')
) {
  API_POST(
    COURSEFLOW_APP.globalContextData.path.json_api.comment.list_by_object,
    {
      objectId: objectId,
      objectType: objectType
    }
  ).then((response: CommentsForObjectQueryResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}
//add a comment to an object
export function addComment(
  objectId,
  objectType,
  text,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.json_api.comment.create, {
    objectId: objectId,
    objectType: objectType,
    text: text
  }).then((response: EmptyPostResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

export function removeComment(
  objectId,
  objectType,
  commentPk,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.json_api.comment.delete, {
    objectId: objectId,
    commentPk: commentPk,
    objectType: objectType
  }).then((response: EmptyPostResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

//Removes all comments from the object
export function removeAllComments(
  objectId,
  objectType,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.json_api.comment.delete_all, {
    objectId: objectId,
    objectType: objectType
  }).then((response: EmptyPostResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}
