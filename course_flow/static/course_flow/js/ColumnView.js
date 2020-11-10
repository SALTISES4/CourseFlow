import React from "react";
import {connect} from "react-redux";

//Basic component representing a column
export class ColumnView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="column";
        this.objectClass=".column-workflow";
    }
    
    render(){
        
    }
}
const mapStateToProps = state=>({
    data:state.workflow
})
const mapDispatchToProps = {};
export default connect(
    mapStateToProps,
    null
)(ColumnView)