import * as Redux from "redux";
import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {getLibrary, getHome, getWorkflowsForProject, searchAllObjects, toggleFavourite, getUsersForObject, duplicateBaseItem, makeProjectLive} from "./PostFunctions";
import * as Constants from "./Constants";
import {WorkflowTitle, Component, TitleText, CollapsibleText} from "./ComponentJSON";
import {MessageBox} from "./MenuComponents";

/*
The main library menu

On mount, this will fetch the user's projects. When they have been
retrieved it will display them in a workflowfilter.
*/

export class LibraryMenu extends React.Component{
    constructor(props){
        super(props);
        this.state={};
        this.createDiv=React.createRef();
    }

    render(){
        return (
            <div class="project-menu">
                {reactDom.createPortal(
                    this.getCreate(),
                    $("#visible-icons")[0]
                )}
                {reactDom.createPortal(
                    this.getOverflowLinks(),
                    $("#overflow-links")[0]
                )}
                <WorkflowFilter renderer={this.props.renderer} workflows={this.state.project_data} context="library"/>
            </div>
        );
    }

    getCreate(){
        let create;
        if(!this.props.renderer.read_only)create = (
            <div class="hover-shade" id="create-project-button" title={gettext("Create project or strategy")} ref={this.createDiv}>
                <span class="material-symbols-rounded filled green">add_circle</span>
                <div id="create-links-project" class="create-dropdown">
                    <a id="project-create-library" href={create_path.project} class="hover-shade">{gettext("New project")}</a>
                    <hr/>
                    <a id="activity-strategy-create" href={create_path.activity_strategy} class="hover-shade">{gettext("New activity strategy")}</a>
                    <a id="course-strategy-create" href={create_path.course_strategy} class="hover-shade">{gettext("New course strategy")}</a>
                </div>
            </div>
        )
        return create;
    }

    getOverflowLinks(){
        let overflow_links = [];
        overflow_links.push(
            <a id="import-old" class="hover-shade" href={get_paths.import}>
                {gettext("Import from old CourseFlow")}
            </a>
        );
        return overflow_links;
    }

    componentDidMount(){
        let component = this;
        getLibrary(
            (data)=>{
                component.setState({project_data:data.data_package});
            }
        );
        makeDropdown(this.createDiv.current)
    }
}

export class HomeMenu extends React.Component{
    constructor(props){
        super(props);
        this.state={projects:[],favourites:[]};
    }

    render(){
        let projects = this.state.projects.map(project=>
            <WorkflowForMenu workflow_data={project} renderer={this.props.renderer}/>
        );
        let favourites =  this.state.favourites.map(project=>
            <WorkflowForMenu workflow_data={project} renderer={this.props.renderer}/>
        );
        let library_path = my_library_path;
        if(!this.props.renderer.is_teacher)library_path=my_liveprojects_path;

        let project_box;
        if(this.props.renderer.is_teacher){
             project_box= (
                <div class="home-item">
                    <div class="home-title-row">
                        <div class="home-item-title">{gettext("Recent Projects")}</div>
                        <a class="collapsed-text-show-more" href={library_path}>{gettext("see all")}</a>
                    </div>
                    <div class="menu-grid">
                        {projects}
                    </div>
                </div>
            )
         }
        else{
             project_box= (
                <div class="home-item">
                    <div class="home-title-row">
                        <div class="home-item-title">{gettext("Recent Classrooms")}</div>
                        <a class="collapsed-text-show-more" href={library_path}>{gettext("see all")}</a>
                    </div>
                    <div class="menu-grid">
                        {projects}
                    </div>
                </div>
            )
         }

        let favourite_box;
        if(this.props.renderer.is_teacher){
            favourite_box = (
                <div class="home-item">
                    <div class="home-title-row">
                        <div class="home-item-title">{gettext("Favourites")}</div>
                        <a class="collapsed-text-show-more" href={library_path+"?favourites=true"}>{gettext("see all")}</a>
                    </div>
                    <div class="menu-grid">
                        {favourites}
                    </div>
                </div>
            )
        }

        return (
            <div class="home-menu-container">
                {project_box}
                {favourite_box}
            </div>
        );
    }

    componentDidMount(){
        let component = this;
        getHome(
            (data)=>{
                component.setState({projects:data.projects,favourites:data.favourites});
            }
        );
    }
}

/*
The project library menu

On mount, this will fetch the workflows for the project. When they have been
retrieved it will display them in a workflowfilter.
*/

export class ProjectMenu extends LibraryMenu{
    constructor(props){
        super(props);
        this.state={data:props.data};
    }

    render(){
        return (
            <div class="project-menu">
                {this.getHeader()}
                <WorkflowFilter renderer={this.props.renderer} workflows={this.state.workflow_data} context="project"/>
                {reactDom.createPortal(
                    this.getOverflowLinks(),
                    $("#overflow-links")[0]
                )}
                {reactDom.createPortal(
                    this.getEdit(),
                    $("#visible-icons")[0]
                )}
                {reactDom.createPortal(
                    this.getCreate(),
                    $("#visible-icons")[0]
                )}
                {reactDom.createPortal(
                    this.getShare(),
                    $("#visible-icons")[0]
                )}
            </div>
        );
    }

    getOverflowLinks(){
        let data = this.state.data;
        let liveproject;
        if(data.author_id==user_id){
            if(data.liveproject){
                liveproject=(
                    <a id="live-project" class="hover-shade" href={update_path.liveproject.replace("0",data.id)}>{gettext("View Classroom")}</a>
                );
            }else{
                liveproject=(
                    <a id="live-project" class="hover-shade" onClick={this.makeLive.bind(this)}>{gettext("Create Classroom")}</a>
                );
            }
        }

        let overflow_links=[liveproject];
        if(data.author_id==user_id)overflow_links.push(<hr/>);
        overflow_links.push(this.getExportButton());
        overflow_links.push(this.getCopyButton());
        overflow_links.push(<hr/>);
        overflow_links.push(
            <a id="comparison-view" class="hover-shade" href="comparison">
                {gettext("Workflow comparison tool")}
            </a>
        );
        return overflow_links;
    }

    makeLive(){
        let component = this;
        if(window.confirm(gettext("Are you sure you want to create a live classroom for this project?"))){
            makeProjectLive(this.props.data.id,(data)=>{
                window.location = update_path.liveproject.replace("0",component.props.data.id);
            });
        }
    }

    getExportButton(){
        if(!user_id)return null;
        let export_button = (
            <div id="export-button" class="hover-shade" onClick={()=>renderMessageBox(this.state.data,"export",closeMessageBox)}>
                <div>{gettext("Export")}</div>
            </div>
        );
        return export_button;
    }

    getCopyButton(){
        if(!user_id)return null;
        let export_button = (
            <div id="copy-button" class="hover-shade" onClick={()=>{ 
                let loader = this.props.renderer.tiny_loader;
                loader.startLoad();
                duplicateBaseItem(this.props.data.id,this.props.data.type,null,(response_data)=>{
                    loader.endLoad();
                    window.location = update_path[response_data.new_item.type].replace("0",response_data.new_item.id);
                })
            }}>
                <div>{gettext("Copy to my library")}</div>
            </div>
        );
        return export_button;
    }

    componentDidMount(){
        let component = this;
        getWorkflowsForProject(
            this.props.data.id,
            (data)=>{
                component.setState({workflow_data:data.data_package});
            }
        );
        this.getUserData();
        makeDropdown($(this.createDiv.current));
    }

    getUserData(){
        let component = this;
        getUsersForObject(this.props.data.id,this.props.data.type,(data)=>{
            component.setState({users:data});
        });
    }

    getHeader(){
        let data=this.state.data;
        return (
            <div class="project-header">
                <WorkflowTitle data={data} no_hyperlink={true} class_name="project-title"/>
                <div class="project-header-info">
                    <div class="project-info-section project-members">
                        <h4>{gettext("Project Members")}</h4>
                        {this.getUsers()}
                    </div>
                    <div class="project-other">
                        <div class="project-info-section project-description">
                            <h4>{gettext("Description")}</h4>
                            <CollapsibleText text={data.description} defaultText={gettext("No description")}/>
                        </div>
                        <div class="project-info-section project-disciplines">
                            <h4>{gettext("Disciplines")}</h4>
                            {this.props.renderer.all_disciplines.filter(discipline=>data.disciplines.indexOf(discipline.id)>=0).map(discipline=>discipline.title).join(", ")||gettext("None")}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    getUsers(){
        if(!this.state.users)return null;
        let author = this.state.users.author;
        let editors = this.state.users.editors;
        let commenters = this.state.users.commentors;
        let viewers = this.state.users.viewers;
        if(!author)return null;
        let users = [
            <div class="user-name">
                {Constants.getUserDisplay(author)+" ("+gettext("owner")+")"}
            </div>,
            editors.filter(user=>user.id!=author.id).map(user=>
                <div class="user-name">
                    {Constants.getUserDisplay(user)+" ("+gettext("edit")+")"}
                </div>
            ),
            commenters.map(user=>
                <div class="user-name">
                    {Constants.getUserDisplay(user)+" ("+gettext("comment")+")"}
                </div>
            ),
            viewers.map(user=>
                <div class="user-name">
                    {Constants.getUserDisplay(user)+" ("+gettext("view")+")"}
                </div>
            ),
        ]
        if(this.state.users.published){
            users.push(
                <div class="user-name">
                    <span class="material-symbols-rounded">public</span> {gettext("All CourseFlow (view)")}
                </div>
            );
        }
        if(!this.props.renderer.read_only)users.push(
            <div class="user-name collapsed-text-show-more" onClick={this.openShareMenu.bind(this)}>
                {gettext("Modify")}
            </div>
        )
        return users;

    }

    getEdit(){
        let edit;
        if(!this.props.renderer.read_only)edit = <div class="hover-shade" id="edit-project-button" title={gettext("Edit Project")} onClick={this.openEditMenu.bind(this)}><span class="material-symbols-rounded filled">edit</span></div>
        return edit;
    }

    openEditMenu(){
        let data = this.state.data;
        renderMessageBox({...data,all_disciplines:this.props.renderer.all_disciplines},"project_edit_menu",this.updateFunction.bind(this));
    }

    getCreate(){
        if(this.props.read_only)return null;
        let create;
        if(!this.props.renderer.read_only)create = (
            <div class="hover-shade" id="create-project-button" title={gettext("Create workflow")} ref={this.createDiv}>
                <span class="material-symbols-rounded filled">add_circle</span>
                <div id="create-links-project" class="create-dropdown">
                    <a id="activity-create-project" href={create_path.activity} class="hover-shade">{gettext("New activity")}</a>
                    <a id="course-create-project" href={create_path.course} class="hover-shade">{gettext("New course")}</a>
                    <a id="program-create-project" href={create_path.program} class="hover-shade">{gettext("New program")}</a>
                </div>
            </div>
        )
        return create;
    }

    updateFunction(new_data){
        let new_state={...this.state};
        new_state.data={...new_state.data,...new_data};
        this.setState(new_state);
    }

    getShare(){
        let share;
        if(!this.props.renderer.read_only)share = <div class="hover-shade" id="share-button" title={gettext("Sharing")} onClick={this.openShareMenu.bind(this)}><span class="material-symbols-rounded filled">person_add</span></div>
        return share;
    }

    openShareMenu(){
        let component=this;
        let data = this.state.data;
        renderMessageBox(data,"share_menu",()=>{
            closeMessageBox();
            component.getUserData();
        });
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
        this.state={workflows:props.workflows,active_filter:0,active_sort:0,reversed:false,search_results:[]}
        this.filters = [
            {name:"all",display:gettext("All")},
            {name:"owned",display:gettext("Owned")},
            {name:"shared",display:gettext("Shared")},
            {name:"favourite",display:gettext("My Favourites")},
            {name:"archived",display:gettext("Archived")},
        ];
        this.sorts = [
            {name:"last_viewed",display:gettext("Recent")},
            {name:"title",display:gettext("A-Z")},
            {name:"created_on",display:gettext("Creation date")},
            {name:"type",display:gettext("Type")},
        ];
        let url_params = new URL(window.location.href).searchParams;
        if(url_params.get("favourites")=="true")this.state.active_filter=this.filters.findIndex(elem=>elem.name=="favourite");
        if(this.props.context=="library")this.search_without=true;
        this.filterDOM=React.createRef();
        this.searchDOM=React.createRef();
        this.sortDOM=React.createRef();
    }

    render(){
        let workflows;
        if(!this.state.workflows)workflows=this.defaultRender();
        else{
            workflows=this.sortWorkflows(this.filterWorkflows(this.state.workflows));
            workflows = workflows.map(workflow=>
                <WorkflowForMenu key={workflow.id} workflow_data={workflow} context={this.props.context}/>
            );
        } 
        let search_results=this.state.search_results.map(workflow=>
            <WorkflowForMenuCondensed workflow_data={workflow} context={this.props.context}/>
        );
        if(this.state.search_filter && this.state.search_filter.length>0 && this.state.search_results.length==0){
            search_results.push(
                <div>{gettext("No results found")}</div>
            );
        }else if(search_results.length==10){
            search_results.push(
                <div class="hover-shade" onClick={()=>this.seeAll()}>{gettext("+ See all")}</div>
            );
        }
        let search_filter_lock;
        if(this.state.search_filter_lock){
            search_filter_lock=(
                <div class="search-filter-lock">
                    <span onClick={this.clearSearchLock.bind(this)} class="material-symbols-rounded hover-shade">close</span>
                    {gettext("Search: "+this.state.search_filter_lock)}
                </div>
            );
        }
        return (
            [
                <div class="workflow-filter-top">
                    <div id="workflow-search" ref={this.searchDOM}>
                        <input
                            placeholder={gettext("Search")}
                            onChange={debounce(this.searchChange.bind(this))}
                            id="workflow-search-input"
                        />
                        <span class="material-symbols-rounded">search</span>
                        <div class="create-dropdown">{search_results}</div>
                        {search_filter_lock}
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
        if(sort=="last_viewed"){
            workflows = workflows.sort((a,b)=>(""+a.object_permission[sort]).localeCompare(b.object_permission[sort]));
            if(!this.state.reversed)return workflows.reverse();
            return workflows;
        }
        else workflows = workflows.sort((a,b)=>(""+a[sort]).localeCompare(b[sort]));
        if(this.state.reversed)return workflows.reverse();
        return workflows;
    }

    filterWorkflows(workflows){
        let filter = this.filters[this.state.active_filter].name;
        if(filter!="archived")workflows = workflows.filter((workflow)=>!workflow.deleted);
        else return workflows.filter((workflow)=>workflow.deleted);
        if(filter=="owned")return workflows.filter((workflow)=>workflow.is_owned);
        if(filter=="shared")return workflows.filter((workflow)=>!workflow.is_owned);
        if(filter=="favourite")return workflows.filter((workflow)=>workflow.favourite);
        return workflows;
    }

    getFilter(){
        let active_filter = this.filters[this.state.active_filter];
        return (
            <div id="workflow-filter" ref={this.filterDOM} class="hover-shade">
                <div class={"workflow-sort-indicator hover-shade item-"+this.state.active_filter}>
                    <span class="material-symbols-rounded">filter_alt</span>
                    <div>{active_filter.display}</div>
                </div>
                <div class="create-dropdown">
                    {this.filters.map((filter,i)=>{
                        let css_class="filter-option";
                        if(this.state.active_filter==i)css_class+=" active";
                        return(
                            <div class={css_class} onClick={()=>this.setState({active_filter:i})}>
                                {filter.display}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    getSort(){
        let active_sort = this.sorts[this.state.active_sort];
        return (
            <div id="workflow-sort" ref={this.sortDOM} class="hover-shade">
                <div class={"workflow-sort-indicator hover-shade item-"+this.state.active_sort}>
                    <span class="material-symbols-rounded">sort</span>
                    <div>{active_sort.display}</div>
                </div>
                <div class="create-dropdown">
                    {this.sorts.map((sort,i)=>{
                        let sort_dir;
                        let css_class="filter-option";
                        if(this.state.active_sort==i){
                            css_class+=" active";
                            if(this.state.reversed)sort_dir=<span class="material-symbols-rounded">north</span>;
                            else sort_dir=<span class="material-symbols-rounded">south</span>
                        }
                        return (<div class={css_class} onClick={(evt)=>{
                            evt.stopPropagation();
                            this.sortChange(i);
                            //This is very hacky, but if we're updating we need to re-open the sort dropdown
                            $(this.sortDOM.current).children(".create-dropdown").addClass("active");
                        }}>
                            {sort_dir}
                            {sort.display}
                        </div>);
                    })}
                </div>
            </div>
        );
    }

    componentDidUpdate(prevProps,prevState){
        if(prevProps.workflows!=this.props.workflows)this.setState({workflows:this.props.workflows});
    }

    sortChange(index){
        if(this.state.active_sort==index)this.setState({reversed:!this.state.reversed});
        else this.setState({active_sort:index,reversed:false});
    }

    searchChange(evt){
        let component=this;
        if(evt.target.value && evt.target.value!=""){
            let filter = evt.target.value.toLowerCase();
            if(this.search_without)component.searchWithout(filter,(response)=>{
                component.setState({search_results:response,search_filter:filter});
                $(this.searchDOM.current).addClass("active");
            });
            else component.searchWithin(filter,(response)=>{
                component.setState({search_results:response,search_filter:filter});
                $(this.searchDOM.current).addClass("active");
            });
        }else{
            component.setState({search_results:[],search_filter:""});
            $(this.searchDOM.current).removeClass("active");
        }
    }

    componentDidMount(){
        makeDropdown(this.filterDOM.current);
        makeDropdown(this.sortDOM.current);
        makeDropdown(this.searchDOM.current);
    }

    searchWithin(request,response_function){
        let workflows = this.state.workflows.filter(workflow=>workflow.title.toLowerCase().indexOf(request)>=0);
        response_function(workflows);
    }

    searchWithout(request,response_function){
        searchAllObjects(request,10,(response_data)=>{
            response_function(response_data.workflow_list);
        });
    }

    seeAll(){
        this.props.renderer.tiny_loader.startLoad();
        let search_filter = this.state.search_filter;
        searchAllObjects(search_filter,0,(response_data)=>{
            this.setState({workflows:response_data.workflow_list,search_filter_lock:search_filter});
            this.props.renderer.tiny_loader.endLoad();
            $("#workflow-search").removeClass("active");
        });
    }

    clearSearchLock(evt){
        this.setState({workflows:this.props.workflows,search_filter_lock:null})
        evt.stopPropagation();
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
        this.state={favourite:props.workflow_data.favourite};
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
                    {this.getTypeIndicator()}
                </div>
                <div class="workflow-created">
                    { creation_text}
                </div>
                <div class="workflow-description" dangerouslySetInnerHTML={{ __html: data.description }}>
                </div>
                {this.getButtons()}
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
        let fav_class="";
        if(this.state.favourite)fav_class=" filled";
        let buttons=[];
        if(this.props.workflow_data.type!="liveproject")buttons.push(
            <div class="workflow-toggle-favourite hover-shade" onClick={(evt)=>{
                toggleFavourite(this.props.workflow_data.id,this.props.workflow_data.type,(!this.state.favourite));
                let state=this.state;
                this.setState({favourite:!(state.favourite)})
                evt.stopPropagation();
            }}>
                <span class={"material-symbols-outlined"+fav_class} title={gettext("Favourite")}>star</span>
            </div>
        )
        if(this.props.workflow_data.type=="project" && this.props.workflow_data.has_liveproject)buttons.push(
            <a class="workflow-live-classroom unset" href={
                update_path["liveproject"].replace("0",this.props.workflow_data.id)
            }>
                <span class="material-symbols-rounded green filled hover-shade" title={gettext("Live Classroom")}>bookmark_added</span>
            </a>
        )
        let workflows;
        if(this.props.workflow_data.type=="project")workflows = (
            <div class="workflow-created">{this.props.workflow_data.workflow_count+" "+gettext("workflows")}</div>
        )
        return (
            <div class="workflow-buttons-row">
                {buttons}
                {workflows}
            </div>
        )
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
        let css_class = "workflow-for-menu simple-workflow hover-shade "+data.type;

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

    getButtons(){
        return null;
    }
}

export function renderMessageBox(data,type,updateFunction){
    reactDom.render(
        <MessageBox message_data={data} message_type={type} actionFunction={updateFunction}/>,
        $("#popup-container")[0]
    );
}



export function closeMessageBox(){
    reactDom.render(null,$("#popup-container")[0]);
}
