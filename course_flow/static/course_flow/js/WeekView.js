import * as React from "react";
import {Provider, connect} from "react-redux";
import {ComponentJSON, TitleText} from "./ComponentJSON.js";
import NodeWeekView from "./NodeWeekView.js";
import {getWeekByID, getNodeWeekByID} from "./FindState.js";
import * as Constants from "./Constants.js";
import {columnChangeNodeWeek, moveNodeWeek, newStrategyAction} from "./Reducers.js";
import {addStrategy} from "./PostFunctions";

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
            <NodeWeekView key={nodeweek} objectID={nodeweek} parentID={data.id} selection_manager={this.props.selection_manager}  column_order={this.props.column_order}/>
        );
        if(nodes.length==0)nodes.push(
            <div class="node-week" style={{height:"100%"}}></div>
        );
        let css_class = "week";
        if(this.state.selected)css_class+=" selected";
        if(data.is_strategy)css_class+=" strategy";
        let default_text;
        if(!is_strategy)default_text = data.week_type_display+" "+(this.props.rank+1);
        return (
            <div class={css_class} ref={this.maindiv} onClick={(evt)=>this.props.selection_manager.changeSelection(evt,this)}>
                {!read_only && !is_strategy && <div class="mouseover-container-bypass">
                    <div class="mouseover-actions">
                        {this.addInsertSibling(data)}
                        {this.addDuplicateSelf(data)}
                        {this.addDeleteSelf(data)}
                    </div>
                </div>
                }
                <TitleText text={data.title} defaultText={default_text}/>
                <div class="node-block" id={this.props.objectID+"-node-block"} ref={this.node_block}>
                    {nodes}
                </div>
                {this.addEditable(data)}
                {data.strategy_classification > 0 && data.is_strategy&&
                    <div class="strategy-tab">
                        <div class="strategy-tab-triangle"></div>
                        <div class="strategy-tab-square">
                            <div class="strategy-tab-circle">
                                <img src= {iconpath+Constants.strategy_keys[data.strategy_classification]+".svg"}/>
                            </div>
                        </div>
                    </div>
                }
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
        this.makeDroppable()
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
        console.log(type);
        this.props.dispatch(moveNodeWeek(id,new_position,new_parent,this.props.nodes_by_column))
    }

    makeDroppable(){
        var props = this.props;
        $(this.maindiv.current).droppable({
            tolerance:"pointer",
            droppable:".strategy-ghost",
            over:(e,ui)=>{
                var drop_item = $(e.target);
                var drag_item = ui.draggable;
                var drag_helper = ui.helper;
                var new_index = drop_item.prevAll().length;
                var new_parent_id = parseInt(drop_item.parent().attr("id")); 
                
                if(drag_item.hasClass("new-strategy")){
                    drag_helper.addClass("valid-drop");
                    drop_item.addClass("new-strategy-drop-over");
                   
                }else{
                    return;
                }
            },
            out:(e,ui)=>{
                var drag_item = ui.draggable;
                var drag_helper = ui.helper;
                var drop_item = $(e.target);
                if(drag_item.hasClass("new-strategy")){
                    drag_helper.removeClass("valid-drop");
                    drop_item.removeClass("new-strategy-drop-over");
                }
            },
            drop:(e,ui)=>{
                $(".new-strategy-drop-over").removeClass("new-strategy-drop-over");
                var drop_item = $(e.target);
                var drag_item = ui.draggable;
                var new_index = drop_item.parent().prevAll().length+1;
                if(drag_item.hasClass("new-strategy")){
                    addStrategy(this.props.parentID,new_index,drag_item[0].dataDraggable.strategy,
                        (response_data)=>{
                            let action = newStrategyAction(response_data);
                            props.dispatch(action);
                        }
                    );
                }
            }
        });
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