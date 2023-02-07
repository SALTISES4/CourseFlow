import * as Redux from "redux";
import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {getLibrary, getWorkflowsForProject} from "./PostFunctions";
import * as Constants from "./Constants";
import {WorkflowTitle, Component} from "./ComponentJSON";

/*
The main library menu

On mount, this will fetch the user's projects. When they have been
retrieved it will display them in a workflowfilter.
*/

export class LibraryMenu extends React.Component{
    constructor(props){
        super(props);
        this.state={};
    }

    render(){
        return (
            <div class="project-menu">
                <WorkflowFilter workflows={this.state.project_data} context="library"/>
            </div>
        );
    }


    componentDidMount(){
        let component = this;
        getLibrary(
            (data)=>{
                component.setState({project_data:data.data_package});
            }
        );
    }
}

/*
The main library menu

On mount, this will fetch the workflows for the project. When they have been
retrieved it will display them in a workflowfilter.
*/

export class ProjectMenu extends LibraryMenu{
    constructor(props){
        super(props);
        this.state={};
    }

    render(){
        return (
            <div class="project-menu">
                <WorkflowFilter workflows={this.state.workflow_data} context="library"/>
            </div>
        );
    }


    componentDidMount(){
        let component = this;
        getWorkflowsForProject(
            this.props.data.id,
            (data)=>{
                component.setState({workflow_data:data.data_package});
            }
        );
    }
}

/*
A container for workflow cards that allows searching and filtering

Accepts a list of workflows as props.
Optional prop search_within restricts searches to the existing list of workflows.

*/

export class WorkflowFilter extends Component{
    constructor(props){
        super(props);
        this.state={active_filter:0,active_sort:0,reversed:false,search_results:[]}
        this.filters = [
            {name:"all",display:gettext("All")},
            {name:"owned",display:gettext("Owned")},
            {name:"shared",display:gettext("Shared")},
            {name:"archived",display:gettext("Archived")},
        ];
        this.sorts = [
            {name:"title",display:gettext("A-Z")},
            {name:"created_on",display:gettext("Creation date")},
            {name:"edit",display:gettext("Recently Edited")},
            {name:"type",display:gettext("Type")},
        ];
    }

    render(){
        let workflows;
        if(!this.props.workflows)workflows=this.defaultRender();
        else workflows=this.sortWorkflows(this.filterWorkflows(this.props.workflows)).map(workflow=>
            <WorkflowForMenu workflow_data={workflow} context={this.props.context}/>
        );
        let search_results=this.state.search_results.map(workflow=>
            <WorkflowForMenuCondensed workflow_data={workflow} context={this.props.context}/>
        );
        console.log(this.state.search_results);
        console.log(search_results);
        return (
            [
                <div class="workflow-filter-top">
                    <div id="workflow-search">
                        <input 
                            onFocus={()=>$("#workflow-search .create-dropdown").addClass("active")}
                            onBlur={()=>$("#workflow-search .create-dropdown").removeClass("active")}
                            onChange={this.searchChange.bind(this)}
                            id="workflow-search-input"
                        />
                        <div class="create-dropdown">{search_results}</div>
                    </div>
                    <div class="workflow-filter-sort">
                        {this.getFilter()}
                        {this.getSort()}
                    </div>
                </div>,
                <div class="menu-grid">
                    {workflows}
                </div>
            ]
        );
    }

    sortWorkflows(workflows){
        let sort = this.sorts[this.state.active_sort].name;
        workflows = workflows.sort((a,b)=>(""+a[sort]).localeCompare(b[sort]));
        if(this.state.reversed)return workflows.reverse();
        return workflows;
    }

    filterWorkflows(workflows){
        let filter = this.filters[this.state.active_filter].name;
        if(filter!="archived")workflows = workflows.filter((workflow)=>!workflow.deleted);
        else return workflows.filter((workflow)=>workflow.deleted);
        if(filter=="owned")return workflows.filter((workflow)=>workflow.is_owned);
        if(filter=="shared")return workflows.filter((workflow)=>!workflow.is_owned);
        return workflows;
    }

    getFilter(){
        let active_filter = this.filters[this.state.active_filter];
        return (
            <div id="workflow-filter" class="hover-shade">
                <div class="hover-shade">{active_filter.display}</div>
                <div class="create-dropdown">
                    {this.filters.map((filter,i)=>
                        <div onClick={()=>this.setState({active_filter:i})}>{filter.display}</div>
                    )}
                </div>
            </div>
        );
    }

    getSort(){
        let active_sort = this.sorts[this.state.active_sort];
        return (
            <div id="workflow-sort" class="hover-shade">
                <div class="hover-shade">{active_sort.display}</div>
                <div class="create-dropdown">
                    {this.sorts.map((sort,i)=>
                        <div onClick={()=>this.setState({active_sort:i})}>{sort.display}</div>
                    )}
                </div>
            </div>
        );
    }

    searchChange(evt){
        let component=this;
        this.searchWithin(evt.target.value,(response)=>component.setState({search_results:response}));
    }

    componentDidMount(){
        makeDropdown("#workflow-filter");
        makeDropdown("#workflow-sort");
    }

    searchWithin(request,response_function){
        let workflows = this.props.workflows.filter(workflow=>workflow.title.indexOf(request)>=0);
        console.log("in search within");
        console.log(workflows);
        response_function(workflows);
    }

    defaultRender(){
        return (<renderers.WorkflowLoader/>);
    }
}


/*
A workflow card for a menu

Props must include workflow_data (serialized model) and context.
Context will determine which actions are added.

Can also optionally receive a clickAction prop to override the behaviour
on click, and "selected" to give it the selected css class.

*/
export class WorkflowForMenu extends Component{
    constructor(props){
        super(props);
        this.state={favourite:props.workflow_data.workflow_favourite};
    }

    render(){
        let data = this.props.workflow_data;
        let css_class = "workflow-for-menu hover-shade "+data.type;
        if(this.props.selected)css_class+=" selected";

        let creation_text = gettext("Created");
        if(data.author && data.author !="None")creation_text+=" "+gettext("by")+" "+data.author;
        creation_text+=" "+data.created_on;

        return(
            <div ref={this.maindiv} class={css_class} onClick={this.clickAction.bind(this)} onMouseDown={(evt)=>{evt.preventDefault()}}>
                <div class="workflow-top-row">
                    <WorkflowTitle no_hyperlink={this.props.no_hyperlink} class_name="workflow-title" data={data}/>
                    {this.getButtons()}
                    {this.getTypeIndicator()}
                </div>
                <div class="workflow-created">
                    { creation_text}
                </div>
                <div class="workflow-description" dangerouslySetInnerHTML={{ __html: data.description }}>
                </div>
            </div>
        );
    }


    getTypeIndicator(){
        let data = this.props.workflow_data;
        let type=data.type
        let type_text = gettext(type);
        if(type=="liveproject")type_text=gettext("classroom");
        if(data.is_strategy)type_text+=gettext(" strategy");
        return (
            <div class={"workflow-type-indicator "+type}>{type_text}</div>
        );
    }

    getButtons(){
        return null;
    }

    clickAction(){
        if(this.props.clickAction){
            this.props.clickAction(this.props.workflow_data.id);
        }else{
            window.location.href=update_path[this.props.workflow_data.type].replace("0",this.props.workflow_data.id);
        }
    }
}

/*
An extension of the workflow card that displays on a single line,
primarily to be used in the search bar

*/
export class WorkflowForMenuCondensed extends WorkflowForMenu{
    render(){
        let data = this.props.workflow_data;
        let css_class = "workflow-for-menu hover-shade "+data.type;

        return(
            <div ref={this.maindiv} class={css_class} onClick={this.clickAction.bind(this)} onMouseDown={(evt)=>{evt.preventDefault()}}>
                <div class="workflow-top-row">
                    <WorkflowTitle no_hyperlink={this.props.no_hyperlink} class_name="workflow-title" data={data}/>
                    {this.getButtons()}
                    {this.getTypeIndicator()}
                </div>
            </div>
        );
    }
}

// export class WorkflowForMenu extends React.Component{
//     constructor(props){
//         super(props);
//         this.state={favourite:props.workflow_data.favourite};
//         this.maindiv = React.createRef();
//     }
    
//     render(){
//         var data = this.props.workflow_data;
//         var css_class = "workflow-for-menu hover-shade "+data.type;
//         if(this.props.selected)css_class+=" selected";
//         if(this.state.hide)return null;
//         let publish_icon = iconpath+'view_none.svg';
//         let publish_text = gettext("PRIVATE");
//         if(data.published){
//             publish_icon = iconpath+'published.svg';
//             publish_text = gettext("PUBLISHED");
//         }
//         let creation_text = gettext("Created");
//         if(data.author && data.author !="None")creation_text+=" "+gettext("by")+" "+data.author;
//         creation_text+=" "+data.created_on;
        
//         return(
//             <div ref={this.maindiv} class={css_class} onClick={this.clickAction.bind(this)} onMouseDown={(evt)=>{evt.preventDefault()}}>
//                 <div class="workflow-top-row">
//                     <WorkflowTitle no_hyperlink={this.props.no_hyperlink} class_name="workflow-title" data={data}/>
//                     {this.getButtons()}
//                     {this.getTypeIndicator()}
//                 </div>
//                 <div class="workflow-created">
//                     { creation_text}
//                 </div>
//                 <div class="workflow-description" dangerouslySetInnerHTML={{ __html: data.description }}>
//                 </div>
//                 <div class="workflow-publication">
//                     <img src={publish_icon}/><div>{publish_text}</div>
//                 </div>
//             </div>
//         );
//     }
    
//     getTypeIndicator(){
//         let data = this.props.workflow_data;
//         let type=data.type
//         let type_text = gettext(type);
//         if(type=="liveproject")type_text=gettext("classroom");
//         if(data.is_strategy)type_text+=gettext(" strategy");
//         return (
//             <div class={"workflow-type-indicator "+type}>{type_text}</div>
//         );
//     }
    
//     clickAction(){
//         if(this.props.selectAction){
//             this.props.selectAction(this.props.workflow_data.id);
//         }else{
//             window.location.href=update_path[this.props.workflow_data.type].replace("0",this.props.workflow_data.id);
//         }
//     }


//     getButtons(){
//         var buttons=[];
//         let favourite_img = "no_favourite.svg";
//         if(this.state.favourite)favourite_img = "favourite.svg";
//         if(this.props.workflow_data.type!="liveproject")buttons.push(
//             <div class="workflow-toggle-favourite hover-shade" onClick={(evt)=>{
//                 toggleFavourite(this.props.workflow_data.id,this.props.workflow_data.type,(!this.state.favourite));
//                 let state=this.state;
//                 this.setState({favourite:!(state.favourite)})
//                 evt.stopPropagation();
//             }}>
//                 <img src={iconpath+favourite_img} title={gettext("Favourite")}/>
//             </div>
//         );
//         if(this.props.type=="projectmenu"||this.props.type=="gridmenu"||this.props.type=="exploremenu"){
//             if(this.props.workflow_data.is_owned){
//                 if(!this.props.workflow_data.deleted){
//                     buttons.push(
//                         <div  class="workflow-delete-button hover-shade" onClick={(evt)=>{
//                             evt.stopPropagation();
//                             if(window.confirm(gettext("Are you sure you want to delete this?"))){
//                                 let loader = new Constants.Loader('body');
//                                 deleteSelf(this.props.workflow_data.id,this.props.workflow_data.type,true,(response_data)=>{
//                                     loader.endLoad();
//                                     window.location.reload();
//                                 });
//                             }
//                         }}>
//                             <img src={iconpath+'rubbish.svg'} title={gettext("Delete")}/>
//                         </div>
//                     );
//                 }else{
//                     buttons.push(
//                         <div  class="workflow-delete-button hover-shade" onClick={(evt)=>{
//                             evt.stopPropagation();
//                             let loader = new Constants.Loader('body');
//                             restoreSelf(this.props.workflow_data.id,this.props.workflow_data.type,(response_data)=>{
//                                 loader.endLoad();
//                                 window.location.reload();
//                             });
//                         }}>
//                             <img src={iconpath+'restore.svg'} title={gettext("Restore")}/>
//                         </div>
//                     );
//                 }
//             }
//             if(this.props.duplicate){
//                 let icon;
//                 let titletext;
//                 if(this.props.duplicate=="copy" && this.props.workflow_data.can_edit){
//                     icon = 'duplicate.svg';
//                     titletext=gettext("Duplicate");
//                     buttons.push(
//                         <div class="workflow-duplicate-button hover-shade" onClick={(evt)=>{
//                             let loader = new Constants.Loader('body');
//                             duplicateBaseItem(this.props.workflow_data.id,this.props.workflow_data.type,this.props.parentID,(response_data)=>{
//                                 loader.endLoad();
//                                 window.location.reload();
//                             });
//                             evt.stopPropagation();
//                         }}>
//                             <img src={iconpath+icon} title={titletext}/>
//                         </div>
//                     );
//                 }
//                 else {
//                     icon = 'import.svg';
//                     titletext=gettext("Import to my files");
//                     buttons.push(
//                         <div class="workflow-duplicate-button hover-shade" onClick={(evt)=>{
//                             var target_parent;
//                             if(this.props.workflow_data.type=="project"||this.props.workflow_data.is_strategy){
//                                 let loader = new Constants.Loader('body');
//                                 duplicateBaseItem(
//                                     this.props.workflow_data.id,this.props.workflow_data.type,
//                                     target_parent,(response_data)=>{
//                                         try{
//                                             this.props.dispatch(gridMenuItemAdded(response_data));
//                                         } catch(err){console.log("Couldn't (or didn't need to) update grid");}
//                                         loader.endLoad();
//                                     }
//                                 );
//                             }else{
//                                 getTargetProjectMenu(this.props.workflow_data.id,(response_data)=>{
//                                     if(response_data.parentID!=null){
//                                         let loader = new Constants.Loader('body');
//                                         duplicateBaseItem(
//                                             this.props.workflow_data.id,this.props.workflow_data.type,
//                                             response_data.parentID,(duplication_response_data)=>{
//                                                try{
//                                                    this.props.dispatch(gridMenuItemAdded(duplication_response_data));
//                                                 } catch(err){console.log("Couldn't (or didn't need to) update grid");}
//                                                 loader.endLoad();
//                                             }
//                                         );
//                                     }
//                                 });
//                             }
//                             evt.stopPropagation();
//                         }}>
//                             <img src={iconpath+icon} title={titletext}/>
//                         </div>
//                     );
//                 }
//             }
//         }
//         if(this.props.previewAction){
//             buttons.push(
//                 <div class="workflow-view-button hover-shade" onClick={(evt)=>{
//                     this.props.previewAction(evt);
//                     evt.stopPropagation();
//                 }}>
//                     <img src={iconpath+"page_view.svg"} title={gettext("Preview")}/>
//                 </div>
//             );
//         }
//         return (
//             <div class="workflow-buttons">
//                 {buttons}
//             </div>
//         );
//     }
// }






// export class MessageBox extends React.Component{
//     render(){
//         var menu;
//         if(this.props.message_type=="linked_workflow_menu"||this.props.message_type=="target_project_menu" || this.props.message_type=="added_workflow_menu" || this.props.message_type=="workflow_select_menu")menu=(
//             <WorkflowsMenu type={this.props.message_type} data={this.props.message_data} actionFunction={this.props.actionFunction}/>
//         );
//         if(this.props.message_type=="project_edit_menu")menu=(
//             <ProjectEditMenu type={this.props.message_type} data={this.props.message_data} actionFunction={this.props.actionFunction}/>
//         );
//         if(this.props.message_type=="share_menu")menu=(
//             <ShareMenu data={this.props.message_data} actionFunction={this.props.actionFunction}/>
//         );
//         if(this.props.message_type=="import")menu=(
//             <ImportMenu data={this.props.message_data} actionFunction={this.props.actionFunction}/>
//         );
//         if(this.props.message_type=="export")menu=(
//             <ExportMenu data={this.props.message_data} actionFunction={this.props.actionFunction}/>
//         );
//         return(
//             <div class="screen-barrier" onClick={(evt)=>evt.stopPropagation()}>
//                 <div class="message-box">
//                     {menu}
//                 </div>
//             </div>
//         );
//     }
// }

// export class WorkflowsMenu extends React.Component{
//     constructor(props){
//         super(props);
//         this.state={};
//         if(this.props.type=="linked_workflow_menu"||this.props.type=="added_workflow_menu")this.project_workflows = props.data.data_package.current_project.sections.map(section=>section.objects.map((object)=>object.id)).flat();
//     }
    
//     render(){
//         var data_package = this.props.data.data_package;
//         let no_hyperlink = false;
//         console.log(this.props.type);
//         if(this.props.type=="linked_workflow_menu" || this.props.type=="added_workflow_menu" || this.props.type=="target_project_menu" || this.props.type=="workflow_select_menu")no_hyperlink=true;
//         var tabs = [];
//         var tab_li = [];
//         var i = 0;
//         for(var prop in data_package){
//             tab_li.push(
//                 <li class="tab-header"><a class="hover-shade" href={"#tabs-"+i}>{data_package[prop].title}</a></li>
//             )
//             tabs.push(
//                 <MenuTab no_hyperlink={no_hyperlink} data={data_package[prop]} type={this.props.type} identifier={i} selected_id={this.state.selected} selectAction={this.workflowSelected.bind(this)}/>
//             )
//             i++;
//         }
//         return(
//             <div class="message-wrap">
//                 <div class="home-tabs" id="workflow-tabs">
//                     <ul>
//                         {tab_li}
//                     </ul>
//                     {tabs}
//                 </div>
//                 <div class="action-bar">
//                     {this.getActions()}
//                 </div>
//             </div>
//         );
        
//     }
    
//     workflowSelected(selected_id,selected_type){
//         this.setState({selected:selected_id,selected_type:selected_type});
//     }

//     getActions(){
//         var actions = [];
//         if(this.props.type=="linked_workflow_menu"){
//             var text=gettext("link to node");
//             if(this.state.selected && this.project_workflows.indexOf(this.state.selected)<0)text=gettext("copy to current project and ")+text;
//             actions.push(
//                 <button id="set-linked-workflow" disabled={!this.state.selected} onClick={()=>{
//                     setLinkedWorkflow(this.props.data.node_id,this.state.selected,this.props.actionFunction)
//                     closeMessageBox();
//                 }}>
//                     {text}
//                 </button>
//             );
//             actions.push(
//                 <button id="set-linked-workflow-none" onClick={()=>{
//                     setLinkedWorkflow(this.props.data.node_id,-1,this.props.actionFunction)
//                     closeMessageBox();
//                 }}>
//                     {gettext("set to none")}
//                 </button>
//             );
//             actions.push(
//                 <button id="set-linked-workflow-cancel" onClick={closeMessageBox}>
//                     {gettext("cancel")}
//                 </button>
//             );
//         }else if(this.props.type=="added_workflow_menu" || this.props.type=="workflow_select_menu"){
//             var text;
//             if(this.props.type=="added_workflow_menu"){
//                 text=gettext("select");
//                 if(this.state.selected && this.project_workflows.indexOf(this.state.selected)<0)text=gettext("copy to current project");
//             }else{
//                 text=gettext("select");
//             }
//             actions.push(
//                 <button id="set-linked-workflow" disabled={!this.state.selected} onClick={()=>{
                    
//                     this.props.actionFunction({workflowID:this.state.selected});
//                     closeMessageBox();
//                 }}>
//                     {text}
//                 </button>
//             );
//             actions.push(
//                 <button id="set-linked-workflow-cancel" onClick={closeMessageBox}>
//                     {gettext("cancel")}
//                 </button>
//             );
//         }else if(this.props.type=="target_project_menu"){
//             actions.push(
//                 <button id="set-linked-workflow" disabled={!this.state.selected} onClick={()=>{
//                     this.props.actionFunction({parentID:this.state.selected});
//                     closeMessageBox();
//                 }}>
//                     {gettext("add to project")}
//                 </button>
//             );
//             actions.push(
//                 <button id="set-linked-workflow-cancel" onClick={closeMessageBox}>
//                     {gettext("cancel")}
//                 </button>
//             );
//         }
//         return actions;
//     }
    
//     componentDidMount(){
//         $("#workflow-tabs").tabs({active:0});
//         $("#workflow-tabs .tab-header").on("click",()=>{this.setState({selected:null})})
//     }
// }



// export class MenuSection extends React.Component{
    
//     constructor(props){
//         super(props);
//         this.dropdownDiv=React.createRef();
//     }
    
//     render(){
//         let section_type = this.props.section_data.object_type;
//         let is_strategy = this.props.section_data.is_strategy;
//         let parentID = this.props.parentID;
//         var objects = this.props.section_data.objects.map((object)=>
//             <WorkflowForMenu no_hyperlink={this.props.no_hyperlink} key={object.id} type={this.props.type} workflow_data={object} objectType={section_type} selected={(this.props.selected_id==object.id)}  dispatch={this.props.dispatch} selectAction={this.props.selectAction} parentID={this.props.parentID} duplicate={this.props.duplicate}/>                            
//         );
//         if(this.props.replacement_text)objects=this.props.replacement_text;
        

//         let add_button;
//         if(create_path && this.props.add){
//             let types;
//             if(section_type=="workflow")types=["program","course","activity"];
//             else types=[section_type];
//             let adds;
//             {
//                 adds=types.map((this_type)=>
//                     <a class="hover-shade" href={create_path[this_type]}>
//                         {gettext("Create new ")+gettext(this_type)}
//                     </a>
//                 );
//                 let import_text = gettext("Import ")+gettext(section_type);
//                 if(is_strategy)import_text+=gettext(" strategy")
//                 adds.push(
//                     <a class="hover-shade" onClick={()=>{
//                         getAddedWorkflowMenu(parentID,section_type,is_strategy,false,(response_data)=>{
//                             if(response_data.workflowID!=null){
//                                 let loader = new Constants.Loader('body');
//                                 duplicateBaseItem(
//                                     response_data.workflowID,section_type,
//                                     parentID,(duplication_response_data)=>{
//     //                                   try{
//     //                                       this.props.dispatch(gridMenuItemAdded(duplication_response_data));
//     //                                    } catch(err){console.log("Couldn't (or didn't need to) update grid");}
//                                         loader.endLoad();
//                                         location.reload();
//                                     }
//                                 );
//                             }
//                         });          
//                     }}>{import_text}</a>
//                 );
//             }
//             add_button=(
//                 [
//                     <div class="menu-create hover-shade" onClick={this.clickAdd.bind(this)}>
//                         <img
//                           class={"create-button create-button-"+this.props.section_data.object_type+" link-image"} title={gettext("Add New")}
//                           src={iconpath+"add_new_white.svg"}
//                         /><div>{this.props.section_data.title}</div>
//                     </div>,
//                     <div class="create-dropdown" ref={this.dropdownDiv}>
//                         {adds}
//                     </div>
//                 ]
//             )
            
//         }

//         return (
//             <div class={"section-"+this.props.section_data.object_type}>
//                 {add_button}
//                 <div class="menu-grid">
//                     {objects}
//                 </div>
//             </div>
//         );
        
//     }
    
//     clickAdd(evt){
//         $(this.dropdownDiv.current)[0].classList.toggle("active");
//     }

//     componentDidMount(){
//         window.addEventListener("click",(evt)=>{
//             if($(evt.target).closest(".menu-create").length==0){
//                 $(".create-dropdown").removeClass("active");
//             }
//         });
//     }
// }

// export class MenuTab extends React.Component{
//     render(){
//         let is_empty=true;
//         for(let i=0;i<this.props.data.sections.length;i++){
//             if(this.props.data.sections[i].objects.length>0){is_empty=false;break;}
//         }
//         let replacement_text;
//         if(is_empty)replacement_text=this.props.data.emptytext;
//         var sections = this.props.data.sections.map((section,i)=>
//             <MenuSection no_hyperlink={this.props.no_hyperlink} type={this.props.type} replacement_text={i==0?replacement_text:null} section_data={section} add={this.props.data.add} selected_id={this.props.selected_id} dispatch={this.props.dispatch} selectAction={this.props.selectAction} parentID={this.props.parentID} duplicate={this.props.data.duplicate}/>
//         );
//         return (
//             <div id={"tabs-"+this.props.identifier}>
//                 {sections}
//             </div>
//         );
//     }
// }

// class WorkflowGridMenuUnconnected extends React.Component{
//     render(){
//         var tabs = [];
//         var tab_li = [];
//         var i = 0;
//         for(var prop in this.props.data_package){
//             tab_li.push(
//                 <li><a class="hover-shade" href={"#tabs-"+i}>{this.props.data_package[prop].title}</a></li>
//             )
//             tabs.push(
//                 <MenuTab data={this.props.data_package[prop]} dispatch={this.props.dispatch} type="gridmenu" identifier={i}/>
//             )
//             i++;
//         }
//         return(
//             <div class="home-tabs" id="home-tabs">
//                 <ul>
//                     {tab_li}
//                 </ul>
//                 {tabs}
//             </div>
//         );
        
//     }
    
//     componentDidMount(){
//         $("#home-tabs").tabs({
//             activate:(evt,ui)=>{
//                 //window.location.hash=ui.newPanel[0].id;
//             }
//         });
//     }
// }
// export const WorkflowGridMenu = connect(
//     state=>({data_package:state}),
//     null
// )(WorkflowGridMenuUnconnected)


// class ProjectMenuUnconnected extends React.Component{
//     constructor(props){
//         super(props);
//         this.state={...props.project,all_disciplines:[]};
//     }
    
//     render(){
//         let data = this.props.project;
//         var tabs = [];
//         var tab_li = [];
//         var i = 0;
//         for(var prop in this.props.data_package){
//             tab_li.push(
//                 <li><a class="hover-shade" href={"#tabs-"+i}>{this.props.data_package[prop].title}</a></li>
//             )
//             tabs.push(
//                 <MenuTab data={this.props.data_package[prop]} dispatch={this.props.dispatch} type="projectmenu" identifier={i} parentID={this.props.project.id}/>
//             )
//             i++;
//         }
//         let share;
//         if(!read_only)share = <div class="hover-shade" id="share-button" title={gettext("Sharing")} onClick={renderMessageBox.bind(this,data,"share_menu",closeMessageBox)}><img src={iconpath+"add_person_grey.svg"}/></div>
        

//         let liveproject;
//         if(data.author_id==user_id){
//             if(this.state.liveproject){
//                 liveproject=(
//                     <a id="live-project" class="hover-shade" href={update_path.liveproject.replace("0",this.state.id)}>{gettext("View Classroom")}</a>
//                 );
//             }else{
//                 liveproject=(
//                     <a id="live-project" class="hover-shade" onClick={this.makeLive.bind(this)}>{gettext("Create Classroom")}</a>
//                 );
//             }
//         }

//         let overflow_links = [];
//         overflow_links.push(liveproject);
//         overflow_links.push(<hr/>);
//         overflow_links.push(this.getExportButton());
//         overflow_links.push(<hr/>);
//         overflow_links.push(
//             <a id="comparison-view" class="hover-shade" href="comparison">
//                 {gettext("Workflow Comparison Tool")}
//             </a>
//         );
        
//         return(
//             <div class="project-menu">
//                 <div class="project-header">
//                     <WorkflowForMenu no_hyperlink={true} workflow_data={this.state} selectAction={this.openEdit.bind(this)}/>
//                     <p>
//                         Disciplines: {
//                             (this.state.all_disciplines.filter(discipline=>this.state.disciplines.indexOf(discipline.id)>=0).map(discipline=>discipline.title).join(", ")||gettext("None"))
//                         }
//                     </p>
                    
//                     {reactDom.createPortal(
//                         share,
//                         $("#visible-icons")[0]
//                     )}
                    
//                     {this.props.project.author_id==user_id  &&
//                         reactDom.createPortal(
//                             <div class="hover-shade" id="edit-project-button" onClick ={ this.openEdit.bind(this)}>
//                                 <img src={iconpath+'edit_pencil.svg'} title={gettext("Edit Project")}/>
//                             </div>,
//                             $("#visible-icons")[0]
//                         )
//                     }
//                     {reactDom.createPortal(
//                         overflow_links,
//                         $("#overflow-links")[0]
//                     )}

                    
//                 </div>
//                 <div class="home-tabs" id="home-tabs">
//                     <ul>
//                         {tab_li}
//                     </ul>
//                     {tabs}
//                 </div>
//             </div>
//         );
//     }
    
//     openEdit(){
//         renderMessageBox({...this.state,id:this.props.project.id},"project_edit_menu",this.updateFunction.bind(this));
//     }
    
//     makeLive(){
//         let component = this;
//         if(window.confirm(gettext("Are you sure you want to create a live classroom for this project?"))){
//             makeProjectLive(this.state.id,(data)=>{
//                 window.location = update_path.liveproject.replace("0",component.state.id);
//             });
//         }
//     }


//     componentDidMount(){
//         $("#home-tabs").tabs({
//             activate:(evt,ui)=>{
//                 //window.location.hash=ui.newPanel[0].id;
//             }
//         });
//         getDisciplines((response)=>{
//             this.setState({all_disciplines:response});
//         });
//     }

//     updateFunction(new_state){
//         this.setState(new_state);
//     }

//     componentDidUpdate(){
//     }

//     getExportButton(){
//         let export_button = (
//             <div id="export-button" class="hover-shade" onClick={()=>renderMessageBox(this.state,"export",closeMessageBox)}>
//                 <div>{gettext("Export")}</div>
//             </div>
            
//         );
//         return export_button;
//     }
                     
// //    getExportButton(){
// //        let exports=[];
// //        this.pushExport(exports,"outcomes_excel",gettext("Outcomes to .xls"));
// //        this.pushExport(exports,"outcomes_csv",gettext("Outcomes to .csv"));
// //        this.pushExport(exports,"frameworks_excel",gettext("Course Framework to .xls"));
// //        this.pushExport(exports,"matrix_excel",gettext("Program Matrix to .xls"));
// //        this.pushExport(exports,"matrix_csv",gettext("Program Matrix to .csv"));
// //        
// //        
// //        let export_button = (
// //            <div id="export-button" class="floatbardiv hover-shade" onClick={()=>$(this.exportDropDown.current).toggleClass("activate")}><img src={iconpath+"download.svg"}/><div>{gettext("Export")}</div>
// //                <div class="create-dropdown" ref={this.exportDropDown}>
// //                    {exports}
// //                </div>
// //            </div>
// //            
// //        )
// //        
// //        return (
// //            reactDom.createPortal(
// //                export_button,
// //                $("#floatbar")[0]
// //            )
// //        )
// //    }
// //                     
// //    pushExport(exports,export_type,text){
// //        exports.push(
// //            <a class="hover-shade" onClick={this.clickExport.bind(this,export_type)}>
// //                {text}
// //            </a>
// //        )
// //    }
// //                     
// //    clickExport(export_type,evt){
// //        evt.preventDefault();
// //        getExport(this.props.project.id,"project",export_type,()=>alert(gettext("Your file is being generated and will be emailed to you shortly.")))
// //    }
// }
// export const ProjectMenu = connect(
//     state=>({data_package:state}),
//     null
// )(ProjectMenuUnconnected)


// export class ProjectEditMenu extends React.Component{
//     constructor(props){
//         super(props);
//         this.state={...props.data,selected_set:"none"};
//         this.object_set_updates={};
//     }
    
//     render(){
//         var data = this.state;
        
//         let all_disciplines;
//         let disciplines;
//         if(data.all_disciplines){
//             all_disciplines = data.all_disciplines.filter(discipline=>data.disciplines.indexOf(discipline.id)==-1).map((discipline)=>
//                 <option value={discipline.id}>{discipline.title}</option>
//             );
//             disciplines = data.all_disciplines.filter(discipline=>data.disciplines.indexOf(discipline.id)>=0).map((discipline)=>
//                 <option value={discipline.id}>{discipline.title}</option>
//             );
//         }
//         let title=Constants.unescapeCharacters(data.title || "");
//         let description=Constants.unescapeCharacters(data.description || "");
        
//         let object_sets=Constants.object_sets_types();
//         let set_options = Object.keys(object_sets).map(key=>
//             <option value={key}>{object_sets[key]}</option>
//         );
        
//         let selected_set;
//         if(this.state.selected_set)selected_set=object_sets[this.state.selected_set];
//         let sets_added = data.object_sets.map(item=>
//             <div class="nomenclature-row">
//                 <div>{object_sets[item.term]+": "}</div>
//                 <input value={item.title} onChange={this.termChanged.bind(this,item.id)}/>
//                 <div class="window-close-button" onClick={this.deleteTerm.bind(this,item.id)}>
//                     <img src={iconpath+"close.svg"}/>
//                 </div>
//             </div>
//         );
        
//         let published_enabled = (data.title && data.disciplines.length>0);
//         if(data.published && !published_enabled)this.setState({published:false})
//         let disabled_publish_text;
//         if(!published_enabled)disabled_publish_text = gettext("A title and at least one discipline is required for publishing.");
//         return(
//             <div class="message-wrap">
//                 <h3>{gettext("Edit Project")+":"}</h3>
//                 <div>
//                     <h4>{gettext("Title")+":"}</h4>
//                     <textarea autocomplete="off" id="project-title-input" value={title} onChange={this.inputChanged.bind(this,"title")}/>
//                 </div>
//                 <div>
//                     <h4>{gettext("Description")+":"}</h4>
//                     <textarea autocomplete="off" id="project-description-input" value={description} onChange={this.inputChanged.bind(this,"description")}/>
//                 </div>
//                 <div>
//                     <h4>{gettext("Disciplines")+":"}</h4>
//                     <div class="multi-select">
//                         <h5>{gettext("This Project")+":"}</h5>
//                         <select id="disciplines_chosen" multiple>
//                             {disciplines}
//                         </select>
//                         <button id="remove-discipline" onClick={this.removeDiscipline.bind(this)}> {gettext("Remove")} </button>
//                     </div>
//                     <div class="multi-select">
//                         <h5>{gettext("All")+":"}</h5>
//                         <select id="disciplines_all" multiple>
//                             {all_disciplines}
//                         </select>
//                         <button id="add-discipline" onClick={this.addDiscipline.bind(this)}> {gettext("Add")} </button>
//                     </div>
                    
//                 </div>
//                 <div>
//                     <h4>{gettext("Published")+":"}</h4>
//                     <div>{disabled_publish_text}</div>
//                     <input id="project-publish-input" disabled={!published_enabled} type="checkbox" name="published" checked={data.published} onChange={this.checkboxChanged.bind(this,"published")}/>
//                     <label for="published">{gettext("Is Published (visible to all users)")}</label>
//                 </div>
//                 <div>
//                     <h4>{gettext("View sets")+":"}</h4>
//                     {sets_added}
//                     <div class="nomenclature-row">
//                         <select id="nomenclature-select" value={this.state.selected_set} onChange={this.inputChanged.bind(this,"selected_set")}>
//                             <option value="none">{gettext("Select a type")}</option>
//                             {set_options}
//                         </select>
//                         <input placeholder={gettext("Set Name")} type="text" id="term-singular" maxlength="50" value={this.state.termsingular} onChange={this.inputChanged.bind(this,"termsingular")} disabled={(selected_set==null)}/>
//                         <button onClick={this.addTerm.bind(this)} disabled={this.addTermDisabled(selected_set)}>
//                             {gettext("Add")}
//                         </button>
//                     </div>
//                 </div>
//                 <div class="action-bar">
//                     {this.getActions()}
//                 </div>
//             </div>
//         );
//     }
    
//     deleteTerm(id){
//         if(window.confirm(gettext("Are you sure you want to delete this ")+gettext("set")+"?")){
//             let new_state_dict=this.state.object_sets.slice()
//             for(let i=0;i<new_state_dict.length;i++){
//                 if(new_state_dict[i].id==id){
//                     deleteSelf(id,"objectset");
//                     new_state_dict.splice(i,1);
//                     this.setState({object_sets:new_state_dict});
//                     break;
//                 }
//             }
//         }
//     }
    
//     addTerm(){
//         let term = $("#nomenclature-select")[0].value;
//         let title = $("#term-singular")[0].value;
//         addTerminology(this.state.id,term,title,"",response_data=>{
//             this.setState({object_sets:response_data.new_dict,selected_set:"none",termsingular:""})
//         });
//     }

//     termChanged(id,evt){
//         let new_sets = this.state.object_sets.slice()
//         for(var i=0;i<new_sets.length;i++){
//             if(new_sets[i].id==id){
//                 new_sets[i]={...new_sets[i],title:evt.target.value};
//                 this.object_set_updates[id]={title:evt.target.value};
//             }
//         }
//         this.setState({object_sets:new_sets});
//     }

//     updateTerms(){
//         for(var object_set_id in this.object_set_updates){
//             updateValueInstant(object_set_id,"objectset",this.object_set_updates[object_set_id]);
//         }
//     }
    
//     addTermDisabled(selected_set){
//         if(!selected_set)return true;
//         if(!this.state.termsingular)return true;
//         return false;
//     }

//     addDiscipline(evt){
//         let selected = $("#disciplines_all").val()
//         $("#disciplines_all").val([]);
//         this.setState(
//             (state,props)=>{
//                 return {disciplines:[...state.disciplines,...selected.map(val=>parseInt(val))]};
//             }
//         )
//     }

//     removeDiscipline(evt){
//         let selected = $("#disciplines_chosen").val()
//         $("#disciplines_chosen").val([]);
//         this.setState(
//             (state,props)=>{
//                 return {
//                     disciplines:state.disciplines.filter(value=>selected.map(val=>parseInt(val)).indexOf(value)==-1)
//                 };
//             }
//         )
//     }
    
    
//     inputChanged(field,evt){
//         var new_state={}
//         new_state[field]=evt.target.value;
//         if(field=="selected_set"){new_state["termsingular"]="";}
//         this.setState(new_state);
//     }

    
//     checkboxChanged(field,evt){
//         if(field=="published"){
//             if(!this.state.published && !window.confirm(gettext("Are you sure you want to publish this project, making it fully visible to anyone with an account?"))){
//                 return;
//             }else if(this.state.published && !window.confirm(gettext("Are you sure you want to unpublish this project, rendering it hidden to all other users?"))){
//                 return;
//             }
//         }
//         var new_state={}
//         new_state[field]=evt.target.checked;
//         this.setState(new_state);
//     }

//     getActions(){
//         var actions = [];
//         actions.push(
//             <button id="save-changes" onClick={()=>{
//                 updateValueInstant(this.state.id,"project",{title:this.state.title,description:this.state.description,published:this.state.published,disciplines:this.state.disciplines});
//                 this.updateTerms();
//                 this.props.actionFunction(this.state);
//                 closeMessageBox();
//             }}>
//                 Save Changes
//             </button>
//         );
//         actions.push(
//             <button onClick={closeMessageBox}>
//                 cancel
//             </button>
//         );
//         return actions;
//     }
// }



// export class ExploreMenu extends React.Component{
//     constructor(props){
//         super(props);
//         this.state={selected:null}
//     }
    
//     render(){
        
        
//         let objects = this.props.data_package.map(object=>
//             <WorkflowForMenu selected={(this.state.selected==object.id)} key={object.id} type={"exploremenu"} workflow_data={object} duplicate={"import"} objectType={object.type} previewAction={this.selectItem.bind(this,object.id,object.type)}/>  
//         )
//         let disciplines = this.props.disciplines.map(discipline=>
//             <li>
//                 <input class = "fillable"  id={"disc-"+discipline.id} type="checkbox" name="disc[]" value={discipline.id}/>
//                 <label for={"disc-"+discipline.id} class="input">{discipline.title}</label>
//             </li>                                            
//         )
//         let page_buttons = [];
//         for(let i=0;i<this.props.pages.page_count;i++){
//             let button_class="page-button";
//             if(i+1==this.props.pages.current_page)button_class+=" active-page-button"
//             page_buttons.push(
//                 <button class={button_class} onClick = {this.toPage.bind(this,i+1)}>{i+1}</button>
//             )
//         }
//         return(
//             <div class="explore-menu">
//                 <h3>{gettext("Explore our database")+":"}</h3>
//                 <form id="search-parameters" action={explore_path} method="GET">
//                     <div>
//                         <div>
//                             <label for="search-keyword">{gettext("Keywords")+":"}</label>
//                             <div class="flex-wrap">
//                                 <input autocomplete="off" class = "fillable" id="search-keyword" name="keyword"/>
//                                 <input id="submit" type="submit" value={gettext("Search")}/>
//                             </div>
//                         </div>
//                         <div>
//                             <label>{gettext("Allowed Types")+":"}</label>
//                             <ul id="search-type" class="search-checklist-block">
//                                 <li><input class = "fillable" id="activity" type="checkbox" name="types[]" value="activity"/><label for="activity" class="input">{gettext("Activity")}</label></li>
//                                 <li><input class = "fillable" id="course" type="checkbox" name="types[]" value="course"/><label for="course" class="input">{gettext("Course")}</label></li>
//                                 <li><input class = "fillable" id="program" type="checkbox" name="types[]" value="program"/><label for="program" class="input">{gettext("Program")}</label></li>
//                                 <li><input class = "fillable" id="project" type="checkbox" name="types[]" value="project"/><label for="project" class="input">{gettext("Project")}</label></li>
//                             </ul>
//                         </div>
//                         <div>
//                             <label>{gettext("Disciplines (leave blank for all):")}</label>
//                             <ul id="search-discipline" class="search-checklist-block">
//                                 {disciplines}
//                             </ul>
//                         </div>
//                     </div>
//                     <div>
//                         <input type="hidden" name="page"/>
//                         <label><div>{gettext("Results Per Page:")}</div>
//                             <select class="fillable" name="results">
//                                 <option value="10">10</option>
//                                 <option value="20">20</option>
//                                 <option selected value="50">50</option>
//                                 <option value="100">100</option>
//                             </select>
//                         </label>
                        
//                     </div>
//                 </form>
//                 <hr/>
//                 <div class="explore-main">
//                     {objects.length>0 &&
//                         [
//                         <p>
//                             {gettext("Showing results")} {this.props.pages.results_per_page*(this.props.pages.current_page-1)+1}-{(this.props.pages.results_per_page*this.props.pages.current_page)} ({this.props.pages.total_results} {gettext("total results")})

//                         </p>,
//                         <p>
//                             <button id="prev-page-button" disabled={(this.props.pages.current_page==1)} onClick={
//                                 this.toPage.bind(this,this.props.pages.current_page-1)
//                             }>{gettext("Previous")}</button>
//                                 {page_buttons}
//                             <button id="next-page-button" disabled={(this.props.pages.current_page==this.props.pages.page_count)} onClick={
//                                 this.toPage.bind(this,this.props.pages.current_page+1)
//                             }>{gettext("Next")}</button>
//                         </p>]
//                     }
//                     {objects.length==0 &&
//                         <p>{gettext("No results were found. Adjust your search parameters, and make sure you have at least one allowed type selected.")}</p>
//                     }
//                     <div class="menu-grid">
//                         {objects}
//                     </div>
//                 </div>
//             </div>
//         );
        
//     }
    
//     toPage(page){
//         $("input[name='page']").attr('value',page);
//         $("#submit").click()
//     }

//     componentDidMount(){
//         let url_params = new URL(window.location.href).searchParams;
//         url_params.forEach((value,key)=>{
//             if(key.indexOf("[]")>=0){
//                 $(".fillable[name='"+key+"'][value='"+value+"']").attr("checked",true);
//             }else{
//                 $(".fillable[name='"+key+"']").val(value);
//             }
            
//         });
//     }

//     selectItem(id,type){
//         this.setState({selected:id})
// //        let loader = new renderers.TinyLoader();
// //        loader.startLoad();
// //        switch(type){
// //            case "activity":
// //            case "course":
// //            case "program":
// //                $.post(post_paths.get_workflow_data,{
// //                    workflowPk:JSON.stringify(id),
// //                }).done(function(data){
// //                    if(data.action=="posted"){
// //                        loader.endLoad();
// //                        var workflow_renderer = new renderers.WorkflowRenderer(JSON.parse(data.data_package));
// //                        workflow_renderer.render($(".explore-preview"));
// //                    }
// //                    else console.log("couldn't show preview");
// //                });
// //                break;
// //            case "project":
// //                $.post(post_paths.get_project_data,{
// //                    projectPk:JSON.stringify(id),
// //                }).done(function(data){
// //                    if(data.action=="posted"){
// //                        loader.endLoad();
// //                        var project_renderer = new renderers.ProjectRenderer(data.data_package,JSON.parse(data.project_data));
// //                        project_renderer.render($(".explore-preview"));
// //                    }
// //                    else console.log("couldn't show preview");
// //                });
// //                break;
// //            case "outcome":
// //                $.post(post_paths.get_outcome_data,{
// //                    outcomePk:JSON.stringify(id),
// //                }).done(function(data){
// //                    if(data.action=="posted"){
// //                        loader.endLoad();
// //                        var outcome_renderer = new renderers.OutcomeRenderer(JSON.parse(data.data_package));
// //                        outcome_renderer.render($(".explore-preview"));
// //                    }
// //                    else console.log("couldn't show preview");
// //                });
// //                break;
// //                
// //            default: 
// //                return;
// //        }
        
//     }
// }

// export function renderMessageBox(data,type,updateFunction){
//     reactDom.render(
//         <MessageBox message_data={data} message_type={type} actionFunction={updateFunction}/>,
//         $("#popup-container")[0]
//     );
// }



// export function closeMessageBox(){
//     reactDom.render(null,$("#popup-container")[0]);
// }
