import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON, TitleText} from "./ComponentJSON.js";
import OutcomeView from "./OutcomeView.js";
import {OutcomeBarOutcomeView} from "./OutcomeView.js";
import {SimpleOutcomeView, TableOutcomeView} from "./OutcomeView.js";
import {getOutcomeOutcomeByID} from "./FindState.js";

//Basic component representing an outcome to outcome link
class OutcomeOutcomeView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcomeoutcome";
    }
    
    render(){
        let data = this.props.data;
        let my_class = "outcome-outcome";
        if(data.no_drag)my_class+=" no-drag";
        
        return (
            <li class={my_class} id={data.id} ref={this.maindiv} data-child-id={data.child}>
                <OutcomeView objectID={data.child} parentID={this.props.parentID} throughParentID={data.id} renderer={this.props.renderer} show_horizontal={this.props.show_horizontal}/>
            </li>
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


//Basic component representing an outcome to outcome link for a simple non-editable block
export class SimpleOutcomeOutcomeViewUnconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcomeoutcome";
    }
    
    render(){
        let data = this.props.data;
        
        return (
            <div class="outcome-outcome" id={data.id} ref={this.maindiv}>
                {this.getChildType()}
            </div>
        );
    }
    
    getChildType(){
        let data = this.props.data;
        return (
            <SimpleOutcomeView objectID={data.child} parentID={this.props.parentID} throughParentID={data.id} comments={this.props.comments} edit={this.props.edit} renderer={this.props.renderer}/>
        );
    }
    
}
export const SimpleOutcomeOutcomeView = connect(
    mapOutcomeOutcomeStateToProps,
    null
)(SimpleOutcomeOutcomeViewUnconnected)


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
                <TableOutcomeView renderer={this.props.renderer} objectID={data.child} parentID={this.props.parentID} throughParentID={data.id} nodecategory={this.props.nodecategory} updateParentCompletion={this.props.updateParentCompletion} completion_status_from_parents={this.props.completion_status_from_parents} outcomes_type={this.props.outcomes_type}/>
            </div>
        );
    }
    
}
export const TableOutcomeOutcomeView = connect(
    mapOutcomeOutcomeStateToProps,
    null
)(TableOutcomeOutcomeViewUnconnected)