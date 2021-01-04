import {Component, createRef} from "react";
import * as reactDom from "react-dom";
import * as Redux from "redux";
import * as React from "react";
import { connect } from 'react-redux';

export const getOutcomeById = (state,index)=>{
    return {data:state.outcomes.};
}

const initialCellChoice = (index) => {
    return {
    }
}

const selectCell = (index) => {
    return {
    }
}

class CellComponent extends React.Component{
    constructor(props){
    }
    
    
    render(){
       
    }
    
   
}

const mapStateToProps = (state,own_props)=>(
    getCellByIndex(state,own_props.index)
)
const mapDispatchToProps = null;
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(CellComponent)
