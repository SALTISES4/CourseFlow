import * as React from "react";
import {Provider, connect} from "react-redux";
import {ComponentJSON} from "./ComponentJSON";
import OutcomeView from "./OutcomeView";
import {TableOutcomeView} from "./OutcomeView";
import {getOutcomeWorkflowByID} from "./FindState";


//Basic component to represent a outcomeworkflow
class OutcomeWorkflowView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="outcomeworkflow";
        this.objectClass=".outcome-workflow";
    }
    
    render(){
        let data = this.props.data;
        return (
            <div class="outcome-workflow" id={data.id}>
                <OutcomeView objectID={data.outcome} parentID={this.props.parentID} throughParentID={data.id} renderer={this.props.renderer}/>
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


class TableOutcomeWorkflowViewUnconnected extends ComponentJSON{
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