//Removes the specified comment from the object
import { EmptyPostResp, CommentsForObjectQueryResp } from '@XMLHTTP/types/query'
import { VERB } from '@cfModule/types/enum'
import { API_POST } from '@XMLHTTP/CallWrapper'

//Get the comments for a particular object
export function getCommentsForObjectQuery(
  objectID: number,
  objectType: any,
  callBackFunction = (_data: CommentsForObjectQueryResp) =>
    console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.json_api.comment.list_by_object, {
    objectID: objectID,
    objectType: objectType
  }).then((response: CommentsForObjectQueryResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}
//add a comment to an object
export function addComment(
  objectID,
  objectType,
  text,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.json_api.comment.create, {
    objectID: objectID,
    objectType: objectType,
    text: text
  }).then((response: EmptyPostResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

export function removeComment(
  objectID,
  objectType,
  commentPk,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.json_api.comment.delete, {
    objectID: objectID,
    commentPk: commentPk,
    objectType: objectType
  }).then((response: EmptyPostResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

//Removes all comments from the object
export function removeAllComments(
  objectID,
  objectType,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.json_api.comment.delete_all, {
    objectID: objectID,
    objectType: objectType
  }).then((response: EmptyPostResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}
