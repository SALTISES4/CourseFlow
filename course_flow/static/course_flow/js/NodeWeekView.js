import * as React from "react";
import {Provider, connect} from "react-redux";
import {ComponentJSON} from "./ComponentJSON.js";
import NodeView from "./NodeView.js";
import {getNodeWeekByID} from "./FindState.js";
import {} from "./Reducers.js";

//Basic component to represent a NodeWeek
class NodeWeekView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="nodeweek";
        this.objectClass=".node-week";
    }
    
    render(){
        let data = this.props.data;
        return (
            <div class="node-week" id={data.id} ref={this.maindiv}>
                <NodeView objectID={data.node} parentID={this.props.parentID} throughParentID={data.id} selection_manager={this.props.selection_manager}/>
            </div>
        );
    }
    
}
const mapNodeWeekStateToProps = (state,own_props)=>(
    getNodeWeekByID(state,own_props.objectID)
)
const mapNodeWeekDispatchToProps = {};
export default connect(
    mapNodeWeekStateToProps,
    null
)(NodeWeekView)
