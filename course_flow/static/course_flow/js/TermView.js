import * as React from "react";
import {Provider, connect} from "react-redux";
import {ComponentJSON, TitleText} from "./ComponentJSON.js";
import {WeekViewUnconnected} from "./WeekView.js";
import NodeWeekView from "./NodeWeekView.js";
import {getTermByID} from "./FindState.js";


//Basic component to represent a Week
class TermView extends WeekViewUnconnected{
    
    render(){
        let data = this.props.data;
        var node_blocks = [];
        for(var i=0;i<this.props.column_order.length;i++){
            let col=this.props.column_order[i];
            let nodeweeks = [];
            for(var j=0;j<data.nodeweek_set.length;j++){
                let nodeweek = data.nodeweek_set[j];
                if(this.props.nodes_by_column[col].indexOf(nodeweek)>=0){
                    nodeweeks.push(
                        <NodeWeekView key={nodeweek} objectID={nodeweek} parentID={data.id} selection_manager={this.props.selection_manager} column_order={this.props.column_order}/>
                    );
                }
            }
            if(nodeweeks.length==0)nodeweeks.push(
                <div class="node-week" style={{height:"100%"}}></div>
            )
            node_blocks.push(
                <div class={"node-block term column-"+col} id={this.props.objectID+"-node-block-column-"+col} key={col} >
                    {nodeweeks}
                </div>
            );
        }
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
                    {node_blocks}
                </div>
                {this.addEditable(data)}
            </div>
        );
    }

    makeDragAndDrop(){
        //Makes the nodeweeks in the node block draggable
        this.makeSortableNode($(this.node_block.current).children().children(".node-week").not(".ui-draggable"),
          this.props.objectID,
          "nodeweek",
          ".node-week",
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
