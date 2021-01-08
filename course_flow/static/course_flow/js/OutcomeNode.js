import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON} from "./ComponentJSON.js";
import {NodeOutcomeView} from "./OutcomeView.js";
import {getOutcomeNodeByID} from "./FindState.js";

//Basic component representing an outcome to outcome link
class OutcomeNodeView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcomenode";
    }
    
    render(){
        let data = this.props.data;
        console.log(this.props);
        
        return (
            <div class="outcome-outcome" id={data.id} ref={this.maindiv}>
                <NodeOutcomeView objectID={data.outcome} parentID={this.props.parentID} throughParentID={data.id}/>
            
                {!read_only && <div class="mouseover-actions">
                    {this.addDeleteSelf(data)}
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