//Removes the specified comment from the object
import { EmptyPostResp, CommentsForObjectQueryResp } from '@XMLHTTP/types/query'
import { VERB } from '@cfModule/types/enum'

export function removeComment(
  objectID,
  objectType,
  commentPk,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.remove_comment, {
      objectID: JSON.stringify(objectID),
      commentPk: JSON.stringify(commentPk),
      objectType: JSON.stringify(objectType)
    }).done(function (data: EmptyPostResp) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Removes all comments from the object
export function removeAllComments(
  objectID,
  objectType,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.remove_all_comments, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType)
    }).done(function (data: EmptyPostResp) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//add a comment to an object
export function addComment(
  objectID,
  objectType,
  text,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.add_comment, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      text: JSON.stringify(text)
    }).done(function (data: EmptyPostResp) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Get the comments for a particular object
export function getCommentsForObjectQuery(
  objectID: number,
  objectType: any,
  callBackFunction = (_data: CommentsForObjectQueryResp) =>
    console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_comments_for_object, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType)
    }).done(function (data: CommentsForObjectQueryResp) {
      console.log('getCommentsForObject data')
      console.log(data)
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}
