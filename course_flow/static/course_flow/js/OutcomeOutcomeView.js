import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON, TitleText} from "./ComponentJSON.js";
import OutcomeView from "./OutcomeView.js";
import {OutcomeBarOutcomeView} from "./OutcomeView.js";
import {NodeOutcomeView, TableOutcomeView} from "./OutcomeView.js";
import {getOutcomeOutcomeByID} from "./FindState.js";

//Basic component representing an outcome to outcome link
class OutcomeOutcomeView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcomeoutcome";
    }
    
    render(){
        let data = this.props.data;
        
        return (
            <div class="outcome-outcome" id={data.id} ref={this.maindiv}>
                <OutcomeView objectID={data.child} parentID={this.props.parentID} throughParentID={data.id} selection_manager={this.props.selection_manager}/>
            </div>
        );
    }
    
}
const mapOutcomeOutcomeStateToProps = (state,own_props)=>(
    getOutcomeOutcomeByID(state,own_props.objectID)
)
export default connect(
    mapOutcomeOutcomeStateToProps,
    null
)(OutcomeOutcomeView)

//Basic component representing an outcome to outcome link
class OutcomeBarOutcomeOutcomeViewUnconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcomeoutcome";
    }
    
    render(){
        let data = this.props.data;
        
        return (
            <div class="outcome-outcome" id={data.id} ref={this.maindiv}>
                <OutcomeBarOutcomeView objectID={data.child} parentID={this.props.parentID} throughParentID={data.id}/>
            </div>
        );
    }
    
}
export const OutcomeBarOutcomeOutcomeView = connect(
    mapOutcomeOutcomeStateToProps,
    null
)(OutcomeBarOutcomeOutcomeViewUnconnected)


//Basic component representing an outcome to outcome link
class NodeOutcomeOutcomeViewUnconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcomeoutcome";
    }
    
    render(){
        let data = this.props.data;
        
        return (
            <div class="outcome-outcome" id={data.id} ref={this.maindiv}>
                <NodeOutcomeView objectID={data.child} parentID={this.props.parentID} throughParentID={data.id}/>
            </div>
        );
    }
    
}
export const NodeOutcomeOutcomeView = connect(
    mapOutcomeOutcomeStateToProps,
    null
)(NodeOutcomeOutcomeViewUnconnected)


//Basic component representing an outcome to outcome link
class TableOutcomeOutcomeViewUnconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcomeoutcome";
    }
    
    render(){
        let data = this.props.data;
        
        return (
            <div class="outcome-outcome" id={data.id} ref={this.maindiv}>
                <TableOutcomeView objectID={data.child} parentID={this.props.parentID} throughParentID={data.id} nodecategory={this.props.nodecategory} updateParentCompletion={this.props.updateParentCompletion} completion_status_from_parents={this.props.completion_status_from_parents} outcomes_type={this.props.outcomes_type}/>
            </div>
        );
    }
    
}
export const TableOutcomeOutcomeView = connect(
    mapOutcomeOutcomeStateToProps,
    null
)(TableOutcomeOutcomeViewUnconnected)