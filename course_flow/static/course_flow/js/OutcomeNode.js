import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON} from "./ComponentJSON";
import {SimpleOutcomeView} from "./OutcomeView";
import {getOutcomeNodeByID, getTableOutcomeNodeByID, getOutcomeByID, getOutcomeOutcomeByID, getNodeByID, getChildWorkflowByID, getOutcomeWorkflowByID} from "./FindState";
import {updateOutcomenodeDegree} from "./PostFunctions";
import * as Constants from "./Constants";
import {TableChildWorkflowView} from "./OutcomeHorizontalLink"

//Basic component representing an outcome to node link
class OutcomeNodeView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcomenode";
    }
    
    render(){
        let data = this.props.data;
        if(data.outcome==-1)return null;
        
        return (
            <div class={"outcome-node outcomenode-"+data.id} id={data.id} ref={this.maindiv}>
                {!read_only && <div>
                    {this.addDeleteSelf(data,"close.svg")}
                </div>
                }
                {Constants.getCompletionImg(data.degree,this.props.outcomes_type)}
                <SimpleOutcomeView objectID={data.outcome} parentID={this.props.parentID} throughParentID={data.id} renderer={this.props.renderer}/>
            </div>
        );
    }
    
    deleteSelf(data){
        let props=this.props;
        if(this.props.deleteSelfOverride)this.props.deleteSelfOverride();
        //Temporary confirmation; add better confirmation dialogue later
        else {
            props.renderer.tiny_loader.startLoad();
            updateOutcomenodeDegree(data.node,data.outcome,0,(response_data)=>{
                props.renderer.tiny_loader.endLoad();
            });
        }
    }
    
}
const mapOutcomeNodeStateToProps = (state,own_props)=>(
    getOutcomeNodeByID(state,own_props.objectID)
)
export default connect(
    mapOutcomeNodeStateToProps,
    null
)(OutcomeNodeView)



//Component representing a cell in a totals column
class TableTotalCellUnconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcomenode";
    }
    
    render(){
        
        let class_name = "table-cell total-cell";
        if(this.props.grand_total)class_name+=" grand-total-cell";
        return (
            <div class={class_name} ref={this.maindiv}>
                {this.getContents(this.getCompletionStatus())}
            </div>
        );
    }
    
    getCompletionStatus(){
        let completion = {};
        let nodes=this.props.nodes;
        //If we are not restricted to a nodes list, use all
        if(!nodes)nodes = Object.keys(this.props.descendant_completion_status);
        for(var i=0;i<nodes.length;i++){
            let node = nodes[i];
            if(this.props.descendant_completion_status[node]){
                for(let oc in this.props.descendant_completion_status[node]){
                    completion[oc]|=this.props.descendant_completion_status[node][oc];
                }
            }
        }
        if(!$.isEmptyObject(completion)){
            return this.checkOutcomeTree(completion,this.props.outcometree);
        }
    }

    checkOutcomeTree(completion,outcometree){
        let self_completion = completion[outcometree.id];
        let child_completion=15;
        let child_count=0;
        for(var i=0;i<outcometree.descendants.length;i++){
            let check_child = this.checkOutcomeTree(completion,outcometree.descendants[i]);
            child_completion &= check_child;
            if(check_child!==undefined)child_count++;
        }
        if(child_count>0)self_completion|=child_completion;
        return self_completion;
    }
    
    getContents(completion_status,self_completion){
        if(completion_status===0){
            return (
                <img src={iconpath+'nocheck.svg'}/>
            );
        }else if(!completion_status){
            return "";
        }
        if(this.props.outcomes_type==0 || completion_status & 1){
            if(self_completion)return(
                <img class="self-completed" src={iconpath+'solid_check.svg'}/>
            )
            else return (
                <img src={iconpath+'check.svg'}/>
            );
        }
        let contents=[];
        if(completion_status & 2){
            let divclass="";
            if(self_completion & 2)divclass=" self-completed";
            contents.push(
                <div class={"outcome-introduced outcome-degree"+divclass}>I</div>
            );
        }
        if(completion_status & 4){
            let divclass="";
            if(self_completion & 4)divclass=" self-completed";
            contents.push(
                <div class={"outcome-developed outcome-degree"+divclass}>D</div>
            );
        }
        if(completion_status & 8){
            let divclass="";
            if(self_completion & 8)divclass=" self-completed";
            contents.push(
                <div class={"outcome-advanced outcome-degree"+divclass}>A</div>
            );
        }
        return contents;
    }
}
const getOutcomeDescendants = (state,outcome)=>{
    let descendants=[];
    for(let i=0;i<outcome.child_outcome_links.length;i++){
        let outcomeoutcome = getOutcomeOutcomeByID(state,outcome.child_outcome_links[i]).data;
        let child = getOutcomeByID(state,outcomeoutcome.child).data;
        descendants.push(getOutcomeDescendants(state,child));
    }
    return {id:outcome.id,descendants:descendants};
}
const mapTableTotalCellStateToProps = (state,own_props)=>({
    outcometree:getOutcomeDescendants(state,getOutcomeByID(state,own_props.outcomeID).data)
})
export const TableTotalCell = connect(
    mapTableTotalCellStateToProps,
    null
)(TableTotalCellUnconnected)

//Component representing a single cell in the outcomes table. It may or may not
//be connected to an outcomenode, depending on if one exists.
export class TableOutcomeNodeUnconnected extends TableTotalCellUnconnected{
    
    constructor(props){
        super(props);
        this.objectType="outcomenode";
    }
    
    render(){
        let data = this.props.data;
        
        
        let completion_status=null;
        if(data!==null)completion_status=data.degree;
        else if(this.props.descendant_completion_status[this.props.nodeID])completion_status=0;
        let checked=false;
        if(data)checked=true;
        
        let input;
        if(!read_only){
                if(this.props.outcomes_type==0)input=(
                <input type="checkbox" onChange={this.toggleFunction.bind(this)} checked={checked}/>
            );
            else {
                let button_content="+";
                if(data){
                    if(data.degree&2)button_content="I";
                    if(data.degree&4)button_content="D";
                    if(data.degree&8)button_content="A";
                    if(data.degree&1)button_content="Y";
                }
                input=(
                    <button onClick={this.clickFunction.bind(this)}>{button_content}</button>
                );
            }
        }
        
        return (
            <div class="table-cell" ref={this.maindiv}>
                {this.getContents(completion_status,completion_status)}
                {input}
            </div>
        );
    }
    
    toggleFunction(){
        let props = this.props;
        let value;
        if(props.data)value=0;
        else value=1;
        props.renderer.tiny_loader.startLoad();
        updateOutcomenodeDegree(props.nodeID,props.outcomeID,value,
            (response_data)=>{
                props.renderer.tiny_loader.endLoad();
            }
        );
        
        
    }

    clickFunction(){
        let props = this.props;
        let value;
        if(props.data){
            value=props.data.degree << 1;
            if(value>15)value=0;
        }else value=1;
        props.renderer.tiny_loader.startLoad();
        updateOutcomenodeDegree(props.nodeID,props.outcomeID,value,
            (response_data)=>{
                props.renderer.tiny_loader.endLoad();
            }
        );
    }

    componentDidUpdate(prevProps){
        if(!this.props.updateParentCompletion)return;
        if(prevProps.data && this.props.data){
            if(prevProps.data.degree!=this.props.data.degree)this.props.updateParentCompletion(this.props.nodeID,this.props.outcomeID,this.props.data.degree);
        }else if(!prevProps.data && this.props.data){
            this.props.updateParentCompletion(this.props.nodeID,this.props.outcomeID,this.props.data.degree);
        }else if(prevProps.data&&!this.props.data){
            this.props.updateParentCompletion(this.props.nodeID,this.props.outcomeID,0);
        }
    }

    postMountFunction(){
        let value=null;
        if(this.props.data)value=this.props.data.degree;
        if(this.props.updateParentCompletion && value)this.props.updateParentCompletion(this.props.nodeID,this.props.outcomeID,value);
    }
    
}
const mapTableOutcomeNodeStateToProps = (state,own_props)=>(
    getTableOutcomeNodeByID(state,own_props.nodeID, own_props.outcomeID)
)
export const TableOutcomeNode = connect(
    mapTableOutcomeNodeStateToProps,
    null
)(TableOutcomeNodeUnconnected)

//Component representing a group of cells
class TableOutcomeGroupUnconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
    }
    
    render(){
        let tableCells;
        if(this.props.renderer.view_type=="horizontaloutcometable"){
            tableCells = this.props.nodes.map((node)=>
                <TableChildWorkflowView renderer={this.props.renderer} descendant_completion_status={this.props.descendant_completion_status} updateParentCompletion={this.props.updateParentCompletion} nodeID={node} outcomeID={this.props.outcomeID}/> 
            )
        }
        else tableCells = this.props.nodes.map((node)=>
            <TableOutcomeNode renderer={this.props.renderer} nodeID={node} outcomeID={this.props.outcomeID} updateParentCompletion={this.props.updateParentCompletion} descendant_completion_status={this.props.descendant_completion_status} outcomes_type={this.props.outcomes_type}/>
        )
        
        let total_list;
        if(this.props.child_outcomes)total_list = this.props.child_outcomes;
        else total_list = this.props.nodes;
        
        
        return(
            <div class="table-group">
                <div class="table-cell blank-cell"></div>
                {tableCells}
                <TableTotalCell outcomes_type={this.props.outcomes_type} nodes={total_list} outcomeID={this.props.outcomeID} descendant_completion_status={this.props.descendant_completion_status}/>
            </div>
        );
    }
}
const mapTableOutcomeGroupStateToProps = (state,own_props)=>{
    if(own_props.renderer.view_type=="horizontaloutcometable"){
        let nodes=own_props.nodes;
        let child_outcomes=[];
        for(let i=0;i<nodes.length;i++){
            let linked_workflow = getNodeByID(state,nodes[i]).data.linked_workflow;
            if(linked_workflow==null)continue;
            let outcomeworkflows = getChildWorkflowByID(state,linked_workflow).data.outcomeworkflow_set;
            for(let j=0;j<outcomeworkflows.length;j++){
                child_outcomes.push(getOutcomeWorkflowByID(state,outcomeworkflows[j]).data.outcome);
            }
        }
        return {child_outcomes:child_outcomes};
    }else return {};
}
export const TableOutcomeGroup = connect(
    mapTableOutcomeGroupStateToProps,
    null
)(TableOutcomeGroupUnconnected)

