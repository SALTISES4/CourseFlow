import React from "react";
import {connect} from "react-redux";

//Basic component to represent a columnworkflow
export class ColumnWorkflowView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="columnworkflow";
        this.objectClass=".column-workflow";
    }
    
    render(){
        let data = this.props.data;
        return (
            <div class={"column-workflow column-"+this.state.id} ref={this.maindiv}>
                <ColumnView objectID={this.state.column}/>
            </div>
        )
    }
}
const mapStateToProps = state=>({
    data:state.workflow
})
const mapDispatchToProps = {};
export default connect(
    mapStateToProps,
    null
)(ColumnWorkflowView)