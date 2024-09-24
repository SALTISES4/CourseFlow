import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import { TGetWeekByIDType, getWeekByID } from '@cfFindState'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'
import {TitleText} from "@cfComponents/UIPrimitives/Titles.ts";
// import $ from 'jquery'

type ConnectedProps = {
  week: TGetWeekByIDType
  workflow: TWorkflow
}

type OwnProps = {
  objectId: number
  rank: number
  parentID?: number
  throughParentID?: number
}
type PropsType = ConnectedProps & OwnProps

/**
 * The week represenation for the "jump to" menu
 */
export class JumpToWeekViewUnconnected extends React.Component<PropsType> {
  private objectType: CfObjectType
  private objectClass: string

  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.WEEK
    this.objectClass = '.week'
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  jumpTo() {
    const week_id = this.props.week.data.id
    const week = $(".week-workflow[data-child-id='" + week_id + "'] > .week")
    if (week.length > 0) {
      // @todo remove this
      const container = $('#container')

      $('#container').animate(
        {
          scrollTop:
            week.offset().top +
            container[0].scrollTop -
            container.offset().top -
            200
        },
        300
      )
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.week.data
    let defaultText

    if (!this.props.workflow.isStrategy) {
      defaultText = data.weekTypeDisplay + ' ' + (this.props.rank + 1)
    }

    let src = apiPaths.external.static_assets.icon + 'plus.svg'

    if (data.isDropped) {
      src = apiPaths.external.static_assets.icon + 'minus.svg'
    }
    return (
      <div className="hover-shade" onClick={this.jumpTo.bind(this)}>
        <TitleText text={data.title} defaultText={defaultText} />
      </div>
    )
  }
}
const mapWeekStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  return {
    week: getWeekByID(state, ownProps.objectId),
    workflow: state.workflow
  }
}

const JumpToWeekView = connect<ConnectedProps, object, OwnProps, AppState>(
  mapWeekStateToProps,
  null
)(JumpToWeekViewUnconnected)

export default JumpToWeekView
