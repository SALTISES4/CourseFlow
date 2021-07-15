import * as React from "react";
import {Provider, connect} from "react-redux";
import {ComponentJSON} from "./ComponentJSON.js";
import ColumnView from "./ColumnView.js";
import {NodeBarColumn, NodeBarColumnCreator} from "./ColumnView.js";
import {getColumnWorkflowByID} from "./FindState.js";

//Basic component to represent a columnworkflow
class ColumnWorkflowView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="columnworkflow";
        this.objectClass=".column-workflow";
    }
    
    render(){
        let data = this.props.data;
        return (
            <div class={"column-workflow column-"+data.id} ref={this.maindiv} id={data.id} data-child-id={data.column}>
                <ColumnView objectID={data.column} parentID={this.props.parentID} throughParentID={data.id} renderer={this.props.renderer}/>
            </div>
        )
    }
}
const mapColumnWorkflowStateToProps = (state,own_props)=>(
    getColumnWorkflowByID(state,own_props.objectID)
)
const mapColumnWorkflowDispatchToProps = {};
export default connect(
    mapColumnWorkflowStateToProps,
    null
)(ColumnWorkflowView)


class NodeBarColumnWorkflowUnconnected extends ComponentJSON{
    render(){
        let data = this.props.data;
        if(data)return(
            <div class="node-bar-column-workflow" ref={this.maindiv}>
                <NodeBarColumn objectID={data.column} renderer={this.props.renderer} throughParentID={data.id} parentID={this.props.parentID}/>
            </div>
        );
        else return(
            <div class="node-bar-column-workflow" ref={this.maindiv}>
                <NodeBarColumnCreator renderer={this.props.renderer} columnType={this.props.columnType}/>
            </div>
        );
    }
}
export const NodeBarColumnWorkflow = connect(
    mapColumnWorkflowStateToProps,
    null
)(NodeBarColumnWorkflowUnconnected)
