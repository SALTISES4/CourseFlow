import * as React from 'react'
import { TitleText } from '@cfCommonComponents/UIComponents/Titles'
import { getWeekByID, TGetWeekByIDType } from '@cfFindState'
import { connect } from 'react-redux'
import { CfObjectType } from '@cfModule/types/enum'
import { AppState } from '@cfRedux/types/type'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'
// import $ from 'jquery'

type ConnectedProps = TGetWeekByIDType
type OwnProps = {
  objectID: number
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
    let default_text

    if (!this.context.is_strategy) {
      default_text = data.week_type_display + ' ' + (this.props.rank + 1)
    }

    let src = COURSEFLOW_APP.config.icon_path + 'plus.svg'

    if (data.is_dropped) {
      src = COURSEFLOW_APP.config.icon_path + 'minus.svg'
    }
    return (
      <div className="hover-shade" onClick={this.jumpTo.bind(this)}>
        <TitleText text={data.title} defaultText={default_text} />
      </div>
    )
  }
}
const mapWeekStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TGetWeekByIDType => {
  return getWeekByID(state, ownProps.objectID)
}

const JumpToWeekView = connect<ConnectedProps, object, OwnProps, AppState>(
  mapWeekStateToProps,
  null
)(JumpToWeekViewUnconnected)

export default JumpToWeekView
