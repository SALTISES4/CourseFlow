import * as React from "react";
import {Provider, connect} from "react-redux";
import OutcomeView from "./OutcomeView.js";
import {TableOutcomeView} from "./OutcomeView.js";
import {getOutcomeWorkflowByID} from "../../FindState.js";


//Basic component to represent a outcomeworkflow
class OutcomeWorkflowView extends React.Component{
    constructor(props){
        super(props);
        this.objectType="outcomeworkflow";
        this.objectClass=".outcome-workflow";
    }

    render(){
        let data = this.props.data;
        let my_class = "outcome-workflow";
        if(data.no_drag)my_class+= " no-drag"
        return (
            <div class={my_class} id={data.id}>
                <OutcomeView objectID={data.outcome} parentID={this.props.parentID} throughParentID={data.id} renderer={this.props.renderer} show_horizontal={this.props.show_horizontal}/>
            </div>
        )
    }
}
const mapOutcomeWorkflowStateToProps = (state,own_props)=>(
    getOutcomeWorkflowByID(state,own_props.objectID)
)
export default connect(
    mapOutcomeWorkflowStateToProps,
    null
)(OutcomeWorkflowView)


class TableOutcomeWorkflowViewUnconnected extends React.Component{
    render(){
        let data = this.props.data;
        return (
            <div>
                <TableOutcomeView renderer={this.props.renderer} objectID={data.outcome} nodecategory={this.props.nodecategory} outcomes_type={this.props.outcomes_type}/>
            </div>
        );
    }
}
export const TableOutcomeWorkflowView = connect(
    mapOutcomeWorkflowStateToProps,
    null
)(TableOutcomeWorkflowViewUnconnected)
