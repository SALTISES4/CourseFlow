import * as Redux from "redux";
import * as React from "react";
import * as reactDom from "react-dom";
import * as Constants from "./Constants.js";
import {Provider, connect} from "react-redux";

class LegendLine extends React.Component{
    render(){
        return (
            <div class="legend-line">
                <img src={iconpath+this.props.icon+".svg"}/>
                <div>{this.props.text}</div>
            </div>
        );
    }
}

class WorkflowLegend extends React.Component{
    
    render(){
        console.log(this.props.contexts);
        let contexts = this.props.contexts.map((value)=>
            <LegendLine icon={Constants.context_keys[value]} text = {context_choices.find((obj)=>obj.type==value).name}/>
        );
        let tasks = this.props.tasks.map((value)=>
            <LegendLine icon={Constants.task_keys[value]} text = {task_choices.find((obj)=>obj.type==value).name}/>
        );
        let strategies = this.props.strategies.map((value)=>
            <LegendLine icon={Constants.strategy_keys[value]} text = {strategy_classification_choices.find((obj)=>obj.type==value).name}/>
        );
        console.log(contexts)

        return (
            <div class="workflow-legend">
                <h4>Legend</h4>
                {contexts.length>0 &&
                    <div class="legend-section">
                        <hr/>
                        <h5>Contexts:</h5>
                        {contexts}
                    </div>
                }
                {contexts.length>0 &&
                    <div class="legend-section">
                        <hr/>
                        <h5>Tasks:</h5>
                        {tasks}
                    </div>
                }
                {contexts.length>0 &&
                    <div class="legend-section">
                        <hr/>
                        <h5>Strategies:</h5>
                        {strategies}
                    </div>
                }
                <div class="window-close-button" onClick = {this.props.toggle}>
                    <img src = {iconpath+"delrect.svg"}/>
                </div>
            </div>
        );
    }
    
    componentDidMount(){
        $(".workflow-legend").draggable();
    }
}
const mapStateToProps = (state)=>{
    let contexts=[]
    let tasks=[]
    let strategies=[]
    let uniqueTest = function(value,index,self){
        return self.indexOf(value)===index;
    }
    contexts=state.node.map(node=>parseInt(node.context_classification)).filter(uniqueTest).filter(value=>value>0);
    tasks=state.node.map(node=>parseInt(node.task_classification)).filter(uniqueTest).filter(value=>value>0);
    strategies=state.week.map(week=>parseInt(week.strategy_classification)).filter(uniqueTest).filter(value=>value>0);
    return {contexts:contexts,tasks:tasks,strategies:strategies};
}
export default connect(
    mapStateToProps,
    null
)(WorkflowLegend)