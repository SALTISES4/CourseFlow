import * as React from "react";
import {Provider, connect} from "react-redux";
import {ComponentJSON, TitleText} from "./ComponentJSON.js";
import NodeStrategyView from "./NodeWeekView.js";
import {getStrategyByID, getNodeStrategyByID} from "./FindState.js";
import * as Constants from "./Constants.js";
import {columnChangeNodeStrategy, moveNodeStrategy} from "./Reducers.js";

//Basic component to represent a Strategy
export class StrategyViewUnconnected extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="strategy";
        this.objectClass=".strategy";
        this.node_block = React.createRef();
    }
    
    render(){
        let data = this.props.data;
        var nodes = data.nodestrategy_set.map((nodestrategy)=>
            <NodeStrategyView key={nodestrategy} objectID={nodestrategy} parentID={data.id} selection_manager={this.props.selection_manager}/>
        );
        if(nodes.length==0)nodes.push(
            <div class="node-strategy" style={{height:"100%"}}></div>
        );
        return (
            <div class={"strategy"+((this.state.selected && " selected")||"")} ref={this.maindiv} onClick={(evt)=>this.props.selection_manager.changeSelection(evt,this)}>
                {!read_only && <div class="mouseover-container-bypass">
                    <div class="mouseover-actions">
                        {this.addInsertSibling(data)}
                        {this.addDuplicateSelf(data)}
                        {this.addDeleteSelf(data)}
                    </div>
                </div>
                }
                <TitleText text={data.title} defaultText={data.strategy_type_display+" "+(this.props.rank+1)}/>
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
        //Makes the nodestrategies in the node block draggable
        this.makeSortableNode($(this.node_block.current).children(".node-strategy").not(".ui-draggable"),
          this.props.objectID,
          "nodestrategy",
          ".node-strategy",
          false,
          [200,1],
          ".node-block",
          ".node");
    }

    stopSortFunction(id,new_position,type,new_parent){
        //this.props.dispatch(moveNodeStrategy(id,new_position,new_parent,this.props.nodes_by_column))
    }
    
    sortableColumnChangedFunction(id,delta_x){
        for(let i=0;i<this.props.nodestrategies.length;i++){
            if(this.props.nodestrategies[i].id==id){
                this.props.dispatch(columnChangeNodeStrategy(this.props.nodestrategies[i].node,delta_x,this.props.column_order));
            }
        }
        
    }
    
    sortableMovedFunction(id,new_position,type,new_parent){
        this.props.dispatch(moveNodeStrategy(id,new_position,new_parent,this.props.nodes_by_column))
    }

}
const mapStrategyStateToProps = (state,own_props)=>(
    getStrategyByID(state,own_props.objectID)
)
const mapStrategyDispatchToProps = {};
export default connect(
    mapStrategyStateToProps,
    null
)(StrategyViewUnconnected)