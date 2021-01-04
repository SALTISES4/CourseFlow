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
        type:"initialCellChoice",
        payload:{index:index}
    }
}

const selectCell = (index) => {
    return {
        type:"cellSelected",
        payload:{index:index}
    }
}

class CellComponent extends React.Component{
    constructor(props){
        super(props);
        this.state={migrating:-1};
        this.maindiv = React.createRef();
    }
    
    
    render(){
        var data = this.props.data;
        let cellClass="grid-cell";
        if(this.props.selected)cellClass+=" selected";
        let migration;
        if(this.state.migrating>=0){
            migration=<MigrateMenu from_index={this.state.migrating} to_index={this.props.index} doneFunction={()=>this.setState({migrating:-1})}/>
        }
        return(
            <div className={cellClass} onClick={this.clickFunction.bind(this)} ref={this.maindiv}>
                <p>{data.habitat}</p>
                {this.getBirdDisplay()}
                <p>Nests: {Math.min(data.nests,Math.floor(data.birds/2))+"/"+data.nests+"/"+data.max_nests}</p>
                <p>Food:</p>
                <ul>
                    <li key={0}>Bugs:{data.food.bugs+"/"+data.max_food.bugs}</li>
                    <li key={1}>Plants:{data.food.plants+"/"+data.max_food.plants}</li>
                    <li key={2}>Fish:{data.food.fish+"/"+data.max_food.fish}</li>
                    <li key={3}>Mice:{data.food.mice+"/"+data.max_food.mice}</li>
                </ul>
                {migration}
            </div>
        );
        
    }
    
    getBirdDisplay(){
        var displays=[];
        let data = this.props.data;
        if(data.birds>0)displays.push(
            <p>Burds: {data.birds}</p>
        );
        if(data.eggs>0)displays.push(
            <p>Eggs: {data.eggs}</p>
        );
        if(data.nestlings>0)displays.push(
            <p>Nestlings: {data.nestlings}</p>
        );
        if(data.fledglings>0)displays.push(
            <p>Fledglings: {data.fledglings}</p>
        );
        if(data.juveniles>0)displays.push(
            <p>Juveniles: {data.juveniles}</p>
        );
        return displays;
        
    }
    
    clickFunction(){
        if(this.props.action_state==ACTION_STATES.INITIAL_CHOICE){
            this.props.dispatch(initialCellChoice(this.props.index));
        }
        else if(this.props.data.birds>0)this.props.dispatch(selectCell(this.props.index));
    }

    componentDidMount(){
        var component = this;
        var index = this.props.index;
        $(this.maindiv.current).draggable({
            distance:10,
            containment:".grid",
            cursorAt:{top:0,left:0},
            helper:(e,item)=>{
                var helper = $(document.createElement("div"));
                helper.data.index=index;
                helper.addClass("drag-helper");
                helper.appendTo(".grid");
                return helper;
            },
            start:(e,ui)=>{
                console.log("dragging");
                $(e.target).addClass("dragging");
                
            },
            stop:(e,ui)=>{
                $(e.target).addClass("dragging");
            },
        });
        
        $(this.maindiv.current).droppable({
            tolerance:"pointer",
            droppable:".drag-helper",
            over:(e,ui)=>{
                
            },
            drop:(e,ui)=>{
                let drag_index = ui.helper.data.index;
                console.log("dropped index "+drag_index+" on index "+index);
                 component.setState({migrating:drag_index});
            }
        });
        
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
