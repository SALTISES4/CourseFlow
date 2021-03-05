import * as React from "react";
import {Provider, connect} from "react-redux";
import {ComponentJSON} from "./ComponentJSON.js";
import NodeView from "./NodeView.js";
import {getNodeStrategyByID} from "./FindState.js";
import {} from "./Reducers.js";

//Basic component to represent a NodeWeek
class NodeStrategyView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="nodestrategy";
        this.objectClass=".node-strategy";
    }
    
    render(){
        let data = this.props.data;
        return (
            <div class="node-strategy" id={data.id} ref={this.maindiv}>
                <NodeView objectID={data.node} parentID={this.props.parentID} throughParentID={data.id} selection_manager={this.props.selection_manager}/>
            </div>
        );
    }
    
}
const mapNodeStrategyStateToProps = (state,own_props)=>(
    getNodeStrategyByID(state,own_props.objectID)
)
const mapNodeStrategyDispatchToProps = {};
export default connect(
    mapNodeStrategyStateToProps,
    null
)(NodeStrategyView)
