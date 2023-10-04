import * as React from "react";
import {Provider, connect} from "react-redux";
import {Component, EditableComponentWithActions} from "../components/CommonComponents.js";
import {getColumnByID} from "../../FindState.js";
import * as Constants from "../../Constants.js";

//Basic component representing a column
class ColumnView extends EditableComponentWithActions{

    constructor(props){
        super(props);
        this.objectType="column";
        this.objectClass=".column";
    }

    render(){
        let data = this.props.data;
        var title = data.title;
        if(!title)title=data.column_type_display;

        let style={};
        if(data.lock){
            style.border="2px solid "+data.lock.user_colour;
        }
        let css_class = "column";
        if(data.lock)css_class+=" locked locked-"+data.lock.user_id;

        let mouseover_actions = [];
        if(!this.props.renderer.read_only){
            mouseover_actions.push(this.addInsertSibling(data));
            mouseover_actions.push(this.addDuplicateSelf(data));
            mouseover_actions.push(this.addDeleteSelf(data));
        }
        if(this.props.renderer.view_comments)mouseover_actions.push(this.addCommenting(data));

        return (
            <div ref={this.maindiv} style={style} class={css_class} onClick={(evt)=>this.props.renderer.selection_manager.changeSelection(evt,this)}>
                <div class="column-line">
                    {this.getIcon()}
                    <div dangerouslySetInnerHTML={{ __html: title }}></div>
                </div>
                {this.addEditable(data)}
                <div class="mouseover-actions">
                    {mouseover_actions}
                </div>
            </div>
        );
    }

    getIcon(){
        if(this.props.data.icon && this.props.data.icon != ""){
            return <span class="material-symbols-rounded">{this.props.data.icon}</span>
        }
        return (
            <img src={config.icon_path+Constants.default_column_settings[this.props.data.column_type].icon+".svg"}/>
        );
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



class NodeBarColumnUnconnected extends Component{
    render(){
        let data = this.props.data;
        var title;
        if(data)title = data.title;
        if(!title)title=data.column_type_display;
        return(
            <div dangerouslySetInnerHTML={{ __html: title }} class={"new-node node-bar-column node-bar-sortable column-"+this.props.objectID} ref={this.maindiv} style={{backgroundColor:Constants.getColumnColour(data)}}>
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

    componentDidMount(){
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


    componentDidMount(){
        this.makeDraggable();
        $(this.maindiv.current)[0].dataDraggable={column:null,column_type:this.props.columnType}
    }
}
