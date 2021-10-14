import * as React from "react";
import {Provider, connect} from "react-redux";
import {ComponentJSON} from "./ComponentJSON.js";
import {getColumnByID} from "./FindState.js";
import * as Constants from "./Constants.js";

//Basic component representing a column
class ColumnView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="column";
        this.objectClass=".column";
    }
    
    render(){
        this.props.renderer.column_colours[this.props.objectID] = this.getColour();
        let data = this.props.data;
        var title = data.title;
        if(!title)title=data.column_type_display;
        
        let style={};
        if(data.lock){
            style.outline="2px solid "+data.lock.user_colour;
        }
        
        return (
            <div ref={this.maindiv} style={style} class={"column"+((this.state.selected && " selected")||"")} onClick={(evt)=>this.props.renderer.selection_manager.changeSelection(evt,this)}>
                <div class="column-line">
                    <img src={this.getIcon()}/>
                    <div>{title}</div>
                </div>
                {this.addEditable(data)}
                {!read_only && <div class="mouseover-actions">
                    {this.addInsertSibling(data)}
                    {this.addDuplicateSelf(data)}
                    {this.addDeleteSelf(data)}
                    {this.addCommenting(data)}
                </div>
                }
            </div>
        );
    }
    
    getColour(){
        if(this.props.data.colour===null)return Constants.default_column_settings[this.props.data.column_type].colour;
        else return "#"+this.props.data.colour?.toString(16);
    }

    getIcon(){
        return iconpath+Constants.default_column_settings[this.props.data.column_type].icon+".svg";
    }
}
const mapColumnStateToProps = (state,own_props)=>(
    getColumnByID(state,own_props.objectID)
)
const mapColumnDispatchToProps = {};
export default connect(
    mapColumnStateToProps,
    null
)(ColumnView)



class NodeBarColumnUnconnected extends ComponentJSON{
    render(){
        let data = this.props.data;
        var title;
        if(data)title = data.title;
        if(!title)title=data.column_type_display;
        return(
            <div class={"new-node node-bar-column node-bar-sortable column-"+this.props.objectID} ref={this.maindiv} style={{borderColor:this.props.renderer.column_colours[this.props.objectID]}}>
                {title}
            </div>
        );
    }
    
    makeDraggable(){
        let draggable_selector = "node-week"
        let draggable_type = "nodeweek"
        $(this.maindiv.current).draggable({
            helper:(e,item)=>{
                var helper = $(document.createElement('div'));
                helper.addClass("node-ghost");
                helper.appendTo(document.body);
                return helper;
            },
            cursor:"move",
            cursorAt:{top:20,left:100},
            distance:10,
            start:(e,ui)=>{
                $(".workflow-canvas").addClass("dragging-"+draggable_type);
                $(draggable_selector).addClass("dragging");
            },
            stop:(e,ui)=>{
                $(".workflow-canvas").removeClass("dragging-"+draggable_type);
                $(draggable_selector).removeClass("dragging");
            }
        });
    }
    
    postMountFunction(){
        this.makeDraggable();
        $(this.maindiv.current)[0].dataDraggable={column:this.props.data.id,column_type:null}
    }
    
    
    
}
export const NodeBarColumn = connect(
    mapColumnStateToProps,
    null
)(NodeBarColumnUnconnected)


export class NodeBarColumnCreator extends NodeBarColumnUnconnected{
    render(){
        var title="New ";
        for(var i=0;i<this.props.renderer.column_choices.length;i++){
            if(this.props.renderer.column_choices[i].type==this.props.columnType){
                title+=this.props.renderer.column_choices[i].name;
                break;
            }
        }
        return(
            <div class="new-node new-column node-bar-column node-bar-sortable" ref={this.maindiv}>
                {title}
            </div>
        );
    }
    
    
    postMountFunction(){
        this.makeDraggable();
        $(this.maindiv.current)[0].dataDraggable={column:null,column_type:this.props.columnType}
    }
}