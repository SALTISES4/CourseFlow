import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum'
import { TitleText } from '@cfComponents/UIPrimitives/Titles'
import { TGetWeekByIDType, getWeekByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'
// import $ from 'jquery'

type ConnectedProps = TGetWeekByIDType
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
  static contextType = WorkFlowConfigContext

  declare context: React.ContextType<typeof WorkFlowConfigContext>

  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.WEEK
    this.objectClass = '.week'
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  jumpTo() {
    const week_id = this.props.data.id
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
    const data = this.props.data
    let defaultText

    if (!this.context.workflow.isStrategy) {
      defaultText = data.weekTypeDisplay + ' ' + (this.props.rank + 1)
    }

    let src =
      COURSEFLOW_APP.globalContextData.path.static_assets.icon + 'plus.svg'

    if (data.isDropped) {
      src =
        COURSEFLOW_APP.globalContextData.path.static_assets.icon + 'minus.svg'
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
): TGetWeekByIDType => {
  return getWeekByID(state, ownProps.objectId)
}

const JumpToWeekView = connect<ConnectedProps, object, OwnProps, AppState>(
  mapWeekStateToProps,
  null
)(JumpToWeekViewUnconnected)

export default JumpToWeekView
