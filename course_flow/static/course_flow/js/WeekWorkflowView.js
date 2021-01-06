import * as React from "react";
import {Provider, connect} from "react-redux";
import {ComponentJSON} from "./ComponentJSON.js";
import StrategyView from "./WeekView.js";
import TermView from "./TermView.js";
import {getStrategyWorkflowByID} from "./FindState.js";
import {} from "./Reducers.js";

//Basic strategyworkflow component
class StrategyWorkflowView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="strategyworkflow";
        this.objectClass=".strategy-workflow";
    }
    
    render(){
        let data = this.props.data;
        console.log("selection manager for weekworkflow");
        console.log(this.props.selection_manager);
        var strategy;
        if(data.strategy_type==2)strategy = (
                <TermView objectID={data.strategy} rank={this.props.order.indexOf(data.id)} parentID={this.props.parentID} throughParentID={data.id} selection_manager={this.props.selection_manager}/>
        );
        else strategy = (
            <StrategyView objectID={data.strategy} rank={this.props.order.indexOf(data.id)} parentID={this.props.parentID} throughParentID={data.id} selection_manager={this.props.selection_manager}/>
        );
        return (
            <div class="strategy-workflow" id={data.id} ref={this.maindiv}>
                {strategy}
            </div>
        );
    }
}
const mapStrategyWorkflowStateToProps = (state,own_props)=>(
    getStrategyWorkflowByID(state,own_props.objectID)
)
const mapStrategyWorkflowDispatchToProps = {};
export default connect(
    mapStrategyWorkflowStateToProps,
    null
)(StrategyWorkflowView)


class NodeBarStrategyWorkflowUnconnected extends ComponentJSON{
    render(){
        let data = this.props.data;
        return null;
    }
}
export const NodeBarStrategyWorkflow = connect(
    mapStrategyWorkflowStateToProps,
    null
)(NodeBarStrategyWorkflowUnconnected)