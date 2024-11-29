import { apiPaths } from '@cf/router/apiRoutes'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import { selectWeekById } from '@cfRedux/selectors/week.selector'
import { AppState } from '@cfRedux/types/type'
import React, { useCallback } from 'react'
import { useSelector } from 'react-redux'

type PropsType = {
  objectId: number
}

const ScrollToWeek = ({ objectId }: PropsType) => {
  const weekData = useSelector((state: AppState) =>
    selectWeekById(state, objectId)
  )
  // call in the workflow here because we use it for the
  // 'week' label which changes based on workflow type
  // we don't have a good solution for this yet
  const workflow = useSelector((state: AppState) => state.workspace.workflow)

  const scrollToHandler = useCallback(() => {
    const element = document.querySelector(
      `[data-scroll-to-id='week-block-${objectId}']`
    )

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }, [objectId])

  return (
    <div
      className="hover-shade"
      onClick={() => {
        scrollToHandler()
      }}
    >
      <TitleText text={weekData.week.title} defaultText={`Week ${objectId}`} />
    </div>
  )
}

export default ScrollToWeek

// import { apiPaths } from '@cf/router/apiRoutes'
// import { CfObjectType } from '@cf/types/enum'
// import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
// import { TGetWeekByIDType, getWeekById } from '@cfFindState'
// import { AppState, TWorkflow } from '@cfRedux/types/type'
// import * as React from 'react'
// import { connect } from 'react-redux'
// // import $ from 'jquery'
//
// type ConnectedProps = {
//   week: TGetWeekByIDType
//   workflow: TWorkflow
// }
//
// type OwnProps = {
//   objectId: number
//   rank: number
//   parentId?: number
//   throughParentId?: number
// }
// type PropsType = ConnectedProps & OwnProps
//
// /**
//  * The week represenation for the "jump to" menu
//  */
// export class JumpToWeekViewUnconnected extends React.Component<PropsType> {
//   private objectType: CfObjectType
//   private objectClass: string
//
//   constructor(props: PropsType) {
//     super(props)
//     this.objectType = CfObjectType.WEEK
//     this.objectClass = '.week'
//   }
//
//   /*******************************************************
//    * FUNCTIONS
//    *******************************************************/
//   jumpTo() {
//     const weekId = this.props.week.data.id
//     const week = $(".week-workflow[data-child-id='" + weekId + "'] > .week")
//     if (week.length > 0) {
//       // @todo remove this
//       const container = $('#container')
//
//       $('#container').animate(
//         {
//           scrollTop:
//             week.offset().top +
//             container[0].scrollTop -
//             container.offset().top -
//             200
//         },
//         300
//       )
//     }
//   }
//
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     const data = this.props.week.data
//     let defaultText
//
//     if (!this.props.workflow.isStrategy) {
//       defaultText = data.weekTypeDisplay + ' ' + (this.props.rank + 1)
//     }
//
//     let src = apiPaths.external.static_assets.icon + 'plus.svg'
//
//     if (data.isDropped) {
//       src = apiPaths.external.static_assets.icon + 'minus.svg'
//     }
//     return (
//       <div className="hover-shade" onClick={this.jumpTo.bind(this)}>
//         <TitleText text={data.title} defaultText={defaultText} />
//       </div>
//     )
//   }
// }
// const mapWeekStateToProps = (
//   state: AppState,
//   ownProps: OwnProps
// ): ConnectedProps => {
//   return {
//     week: getWeekById(state, ownProps.objectId),
//     workflow: state.workflowimport React, { useCallback } from 'react';
// import { useSelector } from 'react-redux';
// import { apiPaths } from '@cf/router/apiRoutes';
// import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts';
// import { getWeekById } from '@cfFindState';
// import { AppState, TWorkflow } from '@cfRedux/types/type';
// import $ from 'jquery'; // Assuming jQuery is still needed for the DOM manipulation
//
// type OwnProps = {
//   objectId: number;
//   rank: number;
//   parentId?: number;
//   throughParentId?: number;
// };
//
// /**
//  * The week representation for the "jump to" menu
//  */
// const JumpToWeekView: React.FC<OwnProps> = ({ objectId, rank }) => {
//   const { week, workflow } = useSelector((state: AppState) => ({
//     week: getWeekById(state, objectId),
//     workflow: state.workflow,
//   }));
//
//   const jumpTo = useCallback(() => {
//     const weekId = week.data.id;
//     const week = $(`.week-workflow[data-child-id='${weekId}'] > .week`);
//     if (week.length > 0) {
//       const container = $('#container');
//       $('#container').animate({
//         scrollTop:
//           week.offset().top +
//           container[0].scrollTop -
//           container.offset().top -
//           200
//       }, 300);
//     }
//   }, [week.data.id]);
//
//   let defaultText = week.data.weekTypeDisplay + ' ' + (rank + 1);
//   if (workflow.isStrategy) {
//     defaultText = undefined; // Adjust based on whether there's a specific condition for when workflow is a strategy
//   }
//
//   let src = apiPaths.external.static_assets.icon + (week.data.isDropped ? 'minus.svg' : 'plus.svg');
//
//   return (
//     <div className="hover-shade" onClick={jumpTo}>
//       <TitleText text={week.data.title} defaultText={defaultText} />
//     </div>
//   );
// };
//
// export default JumpToWeekView;
//
//   }
// }
//
// const JumpToWeekView = connect<ConnectedProps, object, OwnProps, AppState>(
//   mapWeekStateToProps,
//   null
// )(JumpToWeekViewUnconnected)
//
// export default JumpToWeekView
