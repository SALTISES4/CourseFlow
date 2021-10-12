import * as React from "react";
import {Provider, connect} from "react-redux";
import {ComponentJSON, TitleText} from "./ComponentJSON.js";
import NodeWeekView from "./NodeWeekView.js";
import {getWeekByID, getNodeWeekByID} from "./FindState.js";
import * as Constants from "./Constants.js";
import {columnChangeNode, moveNodeWeek, newStrategyAction} from "./Reducers.js";
import {insertedAt,columnChanged,addStrategy} from "./PostFunctions";
import {Loader} from "./Constants.js";

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
        let renderer = this.props.renderer;
        let selection_manager = renderer.selection_manager;
        var nodes = data.nodeweek_set.map((nodeweek)=>
            <NodeWeekView key={nodeweek} objectID={nodeweek} parentID={data.id} renderer={renderer}  column_order={this.props.column_order}/>
        );
        if(nodes.length==0)nodes.push(
            <div class="node-week" style={{height:"100%"}}>Drag and drop nodes from the sidebar to add.</div>
        );
        let css_class = "week";
        if(this.state.selected)css_class+=" selected";
        if(data.is_strategy)css_class+=" strategy";
        let default_text;
        if(!renderer.is_strategy)default_text = data.week_type_display+" "+(this.props.rank+1);
        return (
            <div class={css_class} ref={this.maindiv} onClick={(evt)=>selection_manager.changeSelection(evt,this)}>
                {!read_only && !renderer.is_strategy && <div class="mouseover-container-bypass">
                    <div class="mouseover-actions">
                        {this.addInsertSibling(data)}
                        {this.addDuplicateSelf(data)}
                        {this.addDeleteSelf(data)}
                        {this.addCommenting(data)}
                    </div>
                </div>
                }
                <TitleText text={data.title} defaultText={default_text}/>
                <div class="node-block" id={this.props.objectID+"-node-block"} ref={this.node_block}>
                    {nodes}
                </div>
                {this.addEditable(data)}
                {data.strategy_classification > 0 &&
                    <div class="strategy-tab">
                        <div class="strategy-tab-triangle"></div>
                        <div class="strategy-tab-square">
                            <div class="strategy-tab-circle">
                                <img title={
                                    renderer.strategy_classification_choices.find(
                                        (obj)=>obj.type==data.strategy_classification
                                    ).name
                                } src= {iconpath+Constants.strategy_keys[data.strategy_classification]+".svg"}/>
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
          ".node",
          ".week-block",
        );
        this.makeDroppable()
    }

    stopSortFunction(id,new_position,type,new_parent){
        //this.props.dispatch(moveNodeWeek(id,new_position,new_parent,this.props.nodes_by_column))
    }
    
    sortableColumnChangedFunction(id,delta_x,old_column){
        let columns = this.props.column_order;
        let old_column_index = columns.indexOf(old_column);
        let new_column_index = old_column_index+delta_x;
        if(new_column_index<0 || new_column_index>=columns.length)return;
        let new_column = columns[new_column_index];
        //A little hack to stop ourselves from sending this update a hundred times per second
        if(this.recently_sent_column_change){
            if(this.recently_sent_column_change.column==new_column && Date.now() - this.recently_sent_column_change.lastCall<=500){
                this.recently_sent_column_change.lastCall = Date.now();
                return;
            }
        }
        this.recently_sent_column_change={column:new_column,lastCall:Date.now()};
        this.props.renderer.micro_update(columnChangeNode(id,new_column));
        columnChanged(this.props.renderer,id,new_column);
        
    }
    
    sortableMovedFunction(id,new_position,type,new_parent,child_id){
        this.props.renderer.micro_update(moveNodeWeek(id,new_position,new_parent,this.props.nodes_by_column,child_id));
        insertedAt(this.props.renderer,child_id,"node",new_parent,"week",new_position,"nodeweek");
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
                    let loader = new Loader('body');
                    addStrategy(this.props.parentID,new_index,drag_item[0].dataDraggable.strategy,
                        (response_data)=>{
                            let action = newStrategyAction(response_data);
                            props.dispatch(action);
                            loader.endLoad();
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