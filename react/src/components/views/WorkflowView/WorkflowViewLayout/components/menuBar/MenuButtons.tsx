/*******************************************************
 * VISIBLE BUTTONS
 *******************************************************/
import * as React from 'react'
import { CfObjectType, ViewType } from '@cf/types/enum'
import JumpToWeekWorkflow from '@cfViews/WorkflowView/WorkflowViewLayout/components/menuBar/JumpToWeekWorkflow'
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap'
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';






// const Expand = () => {
//   return (
//     <div id="expand-collapse-all">
//
//       <div className="hover-shade flex-middle">
//         {/* green */}
//
//         <div>{_t('Expand/Collapse')}</div>
//       </div>
//
//       <div className="create-dropdown">
//         {/*<div*/}
//         {/*  className="flex-middle hover-shade"*/}
//         {/*  onClick={this.expandAll.bind(this, CfObjectType.WEEK)}*/}
//         {/*>*/}
//         {/*  /!* green *!/*/}
//         {/*  <ZoomOutMapIcon />*/}
//         {/*  <div>{_t('Expand all weeks')}</div>*/}
//         {/*</div>*/}
//         {/*<div*/}
//         {/*  className="flex-middle hover-shade"*/}
//         {/*  onClick={this.collapseAll.bind(this, CfObjectType.WEEK)}*/}
//         {/*>*/}
//         {/*    /!* green *!/*/}
//         {/*   <ZoomInMapIcon />*/}
//         {/*  <div>{_t('Collapse all weeks')}</div>*/}
//         {/*</div>*/}
//
//         {/*<hr />*/}
//         <div
//           className="flex-middle hover-shade"
//           onClick={this.expandAll.bind(this, CfObjectType.NODE)}
//         >
//            {/* green */}
//           <ZoomOutMapIcon />
//           <div>{_t('Expand all nodes')}</div>
//         </div>
//
//         <div
//           className="flex-middle hover-shade"
//           onClick={this.collapseAll.bind(this, CfObjectType.NODE)}
//         >
//           <span className="green material-symbols-rounded">zoom_in_map</span>
//           <div>{_t('Collapse all nodes')}</div>
//         </div>
//
//         <hr />
//         <div
//           className="flex-middle hover-shade"
//           onClick={this.expandAll.bind(this, CfObjectType.OUTCOME)}
//         >
//           <span className="green material-symbols-rounded">zoom_out_map</span>
//           <div>{_t('Expand all outcomes')}</div>
//         </div>
//
//         <div
//           className="flex-middle hover-shade"
//           onClick={this.collapseAll.bind(this, CfObjectType.OUTCOME)}
//         >
//           <span className="green material-symbols-rounded">zoom_in_map</span>
//           <div>{_t('Collapse all outcomes')}</div>
//         </div>
//       </div>
//     </div>
//   )



// const ShareButton = ({show}:  {show: boolean}) => {
// if (show) {
//   return (
//     <div
//       className="hover-shade"
//       id="share-button"
//       title={_t('Sharing')}
//       onClick={this.openShareDialog.bind(this)}
//     >
//       <span className="material-symbols-rounded filled"></span>
//     </div>
//   )
// }
//   return null
//
// }

// const EditButton = ({show}:  {show: boolean}) => {
//   if (show) {
//     return (
//       <div
//         className="hover-shade"
//         id="edit-project-button"
//         title={}
//         onClick={}
//       >
//
//         <span className="material-symbols-rounded filled">edit</span>
//       </div>
//     )
//   return null
// }

/*******************************************************
 *OVERFLOW LINKS
 *******************************************************/

// const ExportButton = () => {
//   if (this.public_view && !this.user_id) {
//     return null
//   }
//
//   // @todo ...
//   if (!this.context.permissions.workflowPermission.canView) {
//     return null
//   }
//
//   return (
//     <div
//       id="export-button"
//       className="hover-shade"
//       onClick={this.openExportDialog.bind(this)}
//     >
//       <div>{_t('Export')}</div>
//     </div>
//   )
// }

// const CopyButton = () => {
//   if (!this.user_id) return null
//
//   const copy_to_button = [<CopyButton data={this.data} />]
//   if (
//     !this.data.is_strategy &&
//     this.project_permission === Constants.permission_keys.edit
//   ) {
//     copy_to_button.unshift(
//       <div
//         id="copy-to-project-button"
//         className="hover-shade"
//         onClick={() => {
//           const loader = COURSEFLOW_APP.tinyLoader
//           loader.startLoad()
//           duplicateBaseItemQuery(
//             this.data.id,
//             this.data.type,
//             this.project.id,
//             (response_data) => {
//               loader.endLoad()
//               // @ts-ignore
//               window.location =
//                 COURSEFLOW_APP.globalContextData.path.html.update_path_temp.replace(
//                   '0',
//                   // @ts-ignore
//                   response_data.new_item.id
//                 )
//             }
//           )
//         }}
//       >
//         <div>{_t('Copy into current project')}</div>
//       </div>
//     )
//   }
//   return copy_to_button
// }

// const ImportButton = () => {
//   if (this.readOnly) return null
//   const disabled = !!this.data.importing
//   const aClass = disabled ? ' disabled' : 'hover-shade'
//
//   return <ImportButtons aClass={aClass} />
// }

// const DeleteWorkflowButton = () => {
//   if (this.readOnly) return null
//
//   if (!this.data.deleted) {
//     return (
//       <>
//         <hr />
//         <div
//           id="delete-workflow"
//           className="hover-shade"
//           onClick={this.deleteWorkflow.bind(this)}
//         >
//           <div>{_t('Archive workflow')}</div>
//         </div>
//       </>
//     )
//   }
//
//   return (
//     <>
//       <hr />
//       <div
//         id="restore-workflow"
//         className="hover-shade"
//         onClick={this.restoreWorkflow.bind(this)}
//       >
//         <div>{_t('Restore workflow')}</div>
//       </div>
//       <div
//         id="permanently-delete-workflow"
//         className="hover-shade"
//         onClick={this.deleteWorkflowHard.bind(this)}
//       >
//         <div>{_t('Permanently delete workflow')}</div>
//       </div>
//     </>
//   )
// }

const ViewBar = () => {
  return (
    <>
      {/*<Jump />*/}
      {/*<Expand />*/}
      <></>
      <></>
    </>
  )
}

export default ViewBar
