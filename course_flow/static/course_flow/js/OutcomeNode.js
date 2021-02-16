import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON} from "./ComponentJSON.js";
import {NodeOutcomeView} from "./OutcomeView.js";
import {getOutcomeNodeByID, getTableOutcomeNodeByID} from "./FindState.js";
import {deleteSelfAction, addOutcomeToNodeAction, changeField} from "./Reducers.js";
import {addOutcomeToNode} from "./PostFunctions.js";

//Basic component representing an outcome to node link
class OutcomeNodeView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcomenode";
    }
    
    render(){
        let data = this.props.data;
        
        return (
            <div class={"outcome-node outcome-"+data.id} id={data.id} ref={this.maindiv}>
                <NodeOutcomeView objectID={data.outcome} parentID={this.props.parentID} throughParentID={data.id}/>
            
                {!read_only && <div class="mouseover-actions">
                    {this.addDeleteSelf(data,"close.svg")}
                </div>
                }
            </div>
        );
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
export class TableTotalCell extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcomenode";
    }
    
    render(){
        
        let class_name = "table-cell total-cell";
        if(this.props.grand_total)class_name+=" grand-total-cell";
        return (
            <div class={class_name} ref={this.maindiv}>
                {this.getContents(this.props.completion_status)}
            </div>
        );
    }
    
    getContents(completion_status){
        if(completion_status===0){
            return (
                <img src={iconpath+'nocheck.svg'}/>
            );
        }else if(!completion_status){
            return "";
        }
        if(this.props.outcomes_type==0 || completion_status & 1){
            return (
                <img src={iconpath+'check.svg'}/>
            );
        }
        let contents=[];
        if(completion_status & 2){
            contents.push(
                <div class="outcome-introduced outcome-degree">I</div>
            );
        }
        if(completion_status & 4){
            contents.push(
                <div class="outcome-developed outcome-degree">D</div>
            );
        }
        if(completion_status & 8){
            contents.push(
                <div class="outcome-advanced outcome-degree">A</div>
            );
        }
        return contents;
    }

    
}

//Component representing a single cell in the outcomes table. It may or may not
//be connected to an outcomenode, depending on if one exists.
class TableOutcomeNodeUnconnected extends TableTotalCell{
    
    constructor(props){
        super(props);
        this.objectType="outcomenode";
    }
    
    render(){
        let data = this.props.data;
        
        let completion_status;
        if(data)completion_status|=data.degree;
        completion_status|=this.props.completion_status_from_children|this.props.completion_status_from_parents;
        if(completion_status==0&&this.props.completion_status_from_children!==0)completion_status=null;
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
                {this.getContents(completion_status)}
                {input}
            </div>
        );
    }
    
    toggleFunction(){
        let props = this.props;
        let value;
        if(props.data){
            value=0;
            props.dispatch(deleteSelfAction(props.data.id,props.nodeID,"outcomenode"))
        }else{
            value=1;
            addOutcomeToNode(props.nodeID,props.outcomeID,
                (response_data)=>{
                    let action = addOutcomeToNodeAction(response_data);
                    props.dispatch(action);
                }
            );
        }
        if(props.updateParentCompletion)props.updateParentCompletion(props.nodeID,value);
        props.updateSelfCompletion(props.nodeID,value);
    }

    clickFunction(){
        let props = this.props;
        let value;
        if(props.data){
            value=this.props.data.degree << 1;
            if(value>15){
                value=null;
                props.dispatch(deleteSelfAction(props.data.id,props.nodeID,"outcomenode"));
            }else{
                props.dispatch(changeField(props.data.id,"outcomenode","degree",value));
            }
        }else{
            value=1;
            addOutcomeToNode(props.nodeID,props.outcomeID,
                (response_data)=>{
                    let action = addOutcomeToNodeAction(response_data);
                    props.dispatch(action);
                }
            );
        }
        if(props.updateParentCompletion)props.updateParentCompletion(props.nodeID,value);
        props.updateSelfCompletion(props.nodeID,value);
    }

    postMountFunction(){
        let value=null;
        if(this.props.data)value=this.props.data.degree;
        if(this.props.updateParentCompletion && value)this.props.updateParentCompletion(this.props.nodeID,value);
        if(value)this.props.updateSelfCompletion(this.props.nodeID,value);
    }
    
}
const mapTableOutcomeNodeStateToProps = (state,own_props)=>(
    getTableOutcomeNodeByID(state,own_props.nodeID, own_props.outcomeID)
)
export const TableOutcomeNode = connect(
    mapTableOutcomeNodeStateToProps,
    null
)(TableOutcomeNodeUnconnected)

//Component representing a cell in a totals column
export class TableOutcomeGroup extends ComponentJSON{
    
    constructor(props){
        super(props);
    }
    
    render(){
        let completion_status_from_parents={};
        if(this.props.completion_status_from_parents)completion_status_from_parents=this.props.completion_status_from_parents;
        
        let tableCells = this.props.nodes.map((node)=>
            <TableOutcomeNode nodeID={node} outcomeID={this.props.outcomeID} updateParentCompletion={this.props.updateParentCompletion} updateSelfCompletion={this.props.updateSelfCompletion} completion_status_from_children={this.props.completion_status_from_children[node]} completion_status_from_parents={completion_status_from_parents[node]} outcomes_type={this.props.outcomes_type}/>
         )
        let completion_status =0;
        for(let node_id in this.props.completion_status_from_self){
            if(this.props.nodes.indexOf(parseInt(node_id))>=0)completion_status |= this.props.completion_status_from_self[node_id];
        }
        for(let node_id in this.props.completion_status_from_parents){
            if(this.props.nodes.indexOf(parseInt(node_id))>=0)completion_status|=this.props.completion_status_from_parents[node_id];
        }
        let childnodes=0;
        for(let node_id in this.props.completion_status_from_children){
            if(this.props.nodes.indexOf(parseInt(node_id))>=0){
                completion_status|=this.props.completion_status_from_children[node_id];
                childnodes++;
            }
        }
        if(completion_status==0&&childnodes==0)completion_status=null;
        
        return(
            <div class="table-group">
                <div class="table-cell blank-cell"></div>
                {tableCells}
                <TableTotalCell completion_status={completion_status} outcomes_type={this.props.outcomes_type}/>
            </div>
        );
    }
}