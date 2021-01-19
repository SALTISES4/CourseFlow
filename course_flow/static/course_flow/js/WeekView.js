import * as React from "react";
import {Provider, connect} from "react-redux";
import {ComponentJSON, TitleText} from "./ComponentJSON.js";
import NodeWeekView from "./NodeWeekView.js";
import {getWeekByID, getNodeWeekByID} from "./FindState.js";
import * as Constants from "./Constants.js";
import {columnChangeNodeWeek, moveNodeWeek} from "./Reducers.js";

//Basic component to represent a Week
export class WeekViewUnconnected extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="week";
        this.objectClass=".week";
        this.node_block = React.createRef();
    }
    
    render(){
        let data = this.props.data;
        var nodes = data.nodeweek_set.map((nodeweek)=>
            <NodeWeekView key={nodeweek} objectID={nodeweek} parentID={data.id} selection_manager={this.props.selection_manager}/>
        );
        if(nodes.length==0)nodes.push(
            <div class="node-week" style={{height:"100%"}}></div>
        );
        return (
            <div class={"week"+((this.state.selected && " selected")||"")} ref={this.maindiv} onClick={(evt)=>this.props.selection_manager.changeSelection(evt,this)}>
                {!read_only && <div class="mouseover-container-bypass">
                    <div class="mouseover-actions">
                        {this.addInsertSibling(data)}
                        {this.addDuplicateSelf(data)}
                        {this.addDeleteSelf(data)}
                    </div>
                </div>
                }
                <TitleText text={data.title} defaultText={data.week_type_display+" "+(this.props.rank+1)}/>
                <div class="node-block" id={this.props.objectID+"-node-block"} ref={this.node_block}>
                    {nodes}
                </div>
                {this.addEditable(data)}
            </div>
        );
    }
    
    postMountFunction(){
        this.makeDragAndDrop();
    }

    componentDidUpdate(){
        this.makeDragAndDrop();
        Constants.triggerHandlerEach($(this.maindiv.current).find(".node"),"component-updated");
    }

    makeDragAndDrop(){
        //Makes the nodeweeks in the node block draggable
        this.makeSortableNode($(this.node_block.current).children(".node-week").not(".ui-draggable"),
          this.props.objectID,
          "nodeweek",
          ".node-week",
          false,
          [200,1],
          ".node-block",
          ".node");
    }

    stopSortFunction(id,new_position,type,new_parent){
        //this.props.dispatch(moveNodeWeek(id,new_position,new_parent,this.props.nodes_by_column))
    }
    
    sortableColumnChangedFunction(id,delta_x){
        for(let i=0;i<this.props.nodeweeks.length;i++){
            if(this.props.nodeweeks[i].id==id){
                this.props.dispatch(columnChangeNodeWeek(this.props.nodeweeks[i].node,delta_x,this.props.column_order));
            }
        }
        
    }
    
    sortableMovedFunction(id,new_position,type,new_parent){
        this.props.dispatch(moveNodeWeek(id,new_position,new_parent,this.props.nodes_by_column))
    }

}
const mapWeekStateToProps = (state,own_props)=>(
    getWeekByID(state,own_props.objectID)
)
const mapWeekDispatchToProps = {};
export default connect(
    mapWeekStateToProps,
    null
)(WeekViewUnconnected)