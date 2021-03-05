import * as React from "react";
import {Provider, connect} from "react-redux";
import {ComponentJSON, TitleText} from "./ComponentJSON.js";
import {StrategyViewUnconnected} from "./WeekView.js";
import NodeStrategyView from "./NodeWeekView.js";
import {getTermByID} from "./FindState.js";


//Basic component to represent a Strategy
class TermView extends StrategyViewUnconnected{
    
    render(){
        let data = this.props.data;
        var node_blocks = [];
        for(var i=0;i<this.props.column_order.length;i++){
            let col=this.props.column_order[i];
            let nodestrategies = [];
            for(var j=0;j<data.nodestrategy_set.length;j++){
                let nodestrategy = data.nodestrategy_set[j];
                if(this.props.nodes_by_column[col].indexOf(nodestrategy)>=0){
                    nodestrategies.push(
                        <NodeStrategyView key={nodestrategy} objectID={nodestrategy} parentID={data.id} selection_manager={this.props.selection_manager}/>
                    );
                }
            }
            if(nodestrategies.length==0)nodestrategies.push(
                <div class="node-strategy" style={{height:"100%"}}></div>
            )
            node_blocks.push(
                <div class={"node-block term column-"+col} id={this.props.objectID+"-node-block-column-"+col} key={col} >
                    {nodestrategies}
                </div>
            );
        }
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
                    {node_blocks}
                </div>
                {this.addEditable(data)}
            </div>
        );
    }

    makeDragAndDrop(){
        //Makes the nodestrategies in the node block draggable
        this.makeSortableNode($(this.node_block.current).children().children(".node-strategy").not(".ui-draggable"),
          this.props.objectID,
          "nodestrategy",
          ".node-strategy",
          false,
          [200,1],
          ".node-block",
          ".node");
    }
}
const mapTermStateToProps = (state,own_props)=>(
    getTermByID(state,own_props.objectID)
)
const mapTermDispatchToProps = {};
export default connect(
    mapTermStateToProps,
    null
)(TermView)
