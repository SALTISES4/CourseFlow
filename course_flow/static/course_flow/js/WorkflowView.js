import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON} from "./ComponentJSON.js";
import ColumnWorkflowView from "./ColumnWorkflowView.js";
import StrategyWorkflowView from "./WeekWorkflowView.js";
import {NodeBarColumnWorkflow} from "./ColumnWorkflowView.js";
import {NodeBarStrategyWorkflow} from "./WeekWorkflowView.js";
import {WorkflowForMenu} from "./MenuComponents.js";
import * as Constants from "./Constants.js";
import {moveColumnWorkflow, moveStrategyWorkflow} from "./Reducers.js";



//Basic component representing the workflow
class WorkflowView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="workflow";
    }
    
    render(){
        let data = this.props.data;
        var columnworkflows = data.columnworkflow_set.map((columnworkflow)=>
            <ColumnWorkflowView key={columnworkflow} objectID={columnworkflow} parentID={data.id} selection_manager={this.props.selection_manager}/>
        );
        var strategyworkflows = data.strategyworkflow_set.map((strategyworkflow)=>
            <StrategyWorkflowView key={strategyworkflow} objectID={strategyworkflow} parentID={data.id} selection_manager={this.props.selection_manager}/>
        );
        var selector = this;
        
        return(
            <div id="workflow-wrapper" class="workflow-wrapper">
                <div class = "workflow-container">
                    <div class="workflow-details">
                        <WorkflowForMenu workflow_data={data} selected={this.state.selected} selectAction={(evt)=>{this.props.selection_manager.changeSelection(evt,selector)}}/>
                        {this.addEditable(data)}
                        <div class="column-row">
                            {columnworkflows}
                        </div>
                        <div class="strategy-block">
                            {strategyworkflows}
                        </div>
                        <svg class="workflow-canvas" width="100%" height="100%">
                            <defs>
                                <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5"
                                    markerWidth="4" markerHeight="4"
                                    orient="auto-start-reverse">
                                  <path d="M 0 0 L 10 5 L 0 10 z" />
                                </marker>
                            </defs>
                        </svg>
                    </div>
                    {!read_only &&reactDom.createPortal(
                        <NodeBar/>
                    ,$("#container")[0])}
                </div>
            </div>
        );
    }
    
    postMountFunction(){
        this.makeSortable($(".column-row"),
          this.props.objectID,
          "columnworkflow",
          ".column-workflow",
          "x");
        this.makeSortable($(".strategy-block"),
          this.props.objectID,
          "strategyworkflow",
          ".strategy-workflow",
          "y");
    }

    stopSortFunction(){
        Constants.triggerHandlerEach($(".strategy .node"),"component-updated");
    }
    
    
    sortableMovedFunction(id,new_position,type){
        if(type=="columnworkflow")this.props.dispatch(moveColumnWorkflow(id,new_position))
        if(type=="strategyworkflow")this.props.dispatch(moveStrategyWorkflow(id,new_position))
    }
}
const mapWorkflowStateToProps = state=>({
    data:state.workflow
})
const mapWorkflowDispatchToProps = {};
export default connect(
    mapWorkflowStateToProps,
    null
)(WorkflowView)



class NodeBarUnconnected extends ComponentJSON{
    render(){
        let data = this.props.data;
        var nodebarcolumnworkflows = data.columnworkflow_set.map((columnworkflow)=>
            <NodeBarColumnWorkflow key={columnworkflow} objectID={columnworkflow}/>
        );
        var columns_present = this.props.columns.map(col=>col.column_type);
        for(var i=0;i<data.DEFAULT_COLUMNS.length;i++){
            if(columns_present.indexOf(data.DEFAULT_COLUMNS[i])<0){
                nodebarcolumnworkflows.push(
                    <NodeBarColumnWorkflow key={"default"+i} columnType={data.DEFAULT_COLUMNS[i]}/>
                )
            }
        }
        nodebarcolumnworkflows.push(
            <NodeBarColumnWorkflow key={"default"+i} columnType={data.DEFAULT_CUSTOM_COLUMN}/>
        )
        
        
        var nodebarstrategyworkflows = data.strategyworkflow_set.map((strategyworkflow)=>
            <NodeBarStrategyWorkflow key={strategyworkflow} objectID={strategyworkflow}/>
        );
        return reactDom.createPortal(
            <div id="node-bar-workflow" class="right-panel-inner">
                <h4>Nodes:</h4>
                <div class="node-bar-column-block">
                    {nodebarcolumnworkflows}
                </div>
                <div class="node-bar-strategy-block">
                    {nodebarstrategyworkflows}
                </div>
            </div>
        ,$("#node-bar")[0]);
    }
}
const mapNodeBarStateToProps = state=>({
    data:state.workflow,
    columns:state.column
})
export const NodeBar = connect(
    mapNodeBarStateToProps,
    null
)(NodeBarUnconnected)
