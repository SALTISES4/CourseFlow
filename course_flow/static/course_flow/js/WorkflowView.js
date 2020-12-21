import React from "react";
import {connect} from "react-redux";

//Basic component representing the workflow
export class WorkflowView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.nodebar = createRef();
    }
    
    render(){
        let data = this.props.data;
        var columnworkflows = data.columnworkflow_set.map((columnworkflow)=>
            <ColumnWorkflowViewConnected key={columnworkflow} objectID={columnworkflow}/>
        );
        /*var strategyworkflows = data.strategyworkflow_set.map((strategyworkflow)=>
            <StrategyWorkflowViewConnected key={strategyworkflow} objectID={strategyworkflow}/>
        );*/
        
        return(
            <div id="workflow-wrapper" class="workflow-wrapper">
                <div class = "workflow-container">
                    <div class="workflow-details">
                        
                    </div>
                </div>
            </div>
        );
    }
}
const mapStateToProps = state=>({
    data:state.workflow
})
const mapDispatchToProps = {};
export default connect(
    mapStateToProps,
    null
)(WorkflowView)