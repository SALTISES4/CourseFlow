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
                        <NodeWeekView key={nodeweek} objectID={nodeweek} parentID={data.id} renderer={this.props.renderer} column_order={this.props.column_order}/>
                    );
                }
            }
            if(nodeweeks.length==0)nodeweeks.push(
                <div class="node-week placeholder" style={{height:"100%"}}></div>
            )
            node_blocks.push(
                <div class={"node-block term column-"+col} id={this.props.objectID+"-node-block-column-"+col} key={col} >
                    {nodeweeks}
                </div>
            );
        }
        
        let css_class = "week";
        if(data.is_strategy)css_class+=" strategy";
        if(data.lock)css_class+=" locked locked-"+data.lock.user_id;
        if(data.is_dropped)css_class+=" dropped";
        
        
        let style={};
        if(data.lock){
            style.border="2px solid "+data.lock.user_colour;
        }
        let dropIcon;
        if(data.is_dropped)dropIcon = "droptriangleup";
        else dropIcon = "droptriangledown";
        
        let mouseover_actions = [];
        if(!read_only){
            mouseover_actions.push(this.addInsertSibling(data));
            mouseover_actions.push(this.addDuplicateSelf(data));
            mouseover_actions.push(this.addDeleteSelf(data));
        }
        mouseover_actions.push(this.addCommenting(data));
        
        return (
            <div style={style} class={css_class} ref={this.maindiv} onClick={(evt)=>this.props.renderer.selection_manager.changeSelection(evt,this)}>
                <div class="mouseover-container-bypass">
                    <div class="mouseover-actions">
                        {mouseover_actions}
                    </div>
                </div>
                <TitleText text={data.title} defaultText={data.week_type_display+" "+(this.props.rank+1)}/>
                <div class="node-block" id={this.props.objectID+"-node-block"} ref={this.node_block}>
                    {node_blocks}
                </div>
                <div class = "week-drop-row hover-shade" onClick={this.toggleDrop.bind(this)}>
                    <div class = "node-drop-side node-drop-left"></div>
                    <div class = "node-drop-middle"><img src={iconpath+dropIcon+".svg"}/></div>
                    <div class = "node-drop-side node-drop-right">
                    </div>
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
          null,
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
