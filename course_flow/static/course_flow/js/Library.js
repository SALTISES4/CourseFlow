import * as Redux from "redux";
import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {getLibrary, getFavourites, getHome, getWorkflowsForProject, searchAllObjects, getDisciplines, toggleFavourite, getUsersForObject, duplicateBaseItem, makeProjectLive, deleteSelf, restoreSelf} from "./PostFunctions";
import * as Constants from "./Constants";
import {WorkflowTitle, Component, TitleText, CollapsibleText} from "./ComponentJSON";
import {MessageBox, renderMessageBox, closeMessageBox} from "./MenuComponents";

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

export class ExploreMenu extends LibraryMenu{

    render(){
        return (
            <div class="project-menu">
                <ExploreFilter disciplines={this.props.disciplines} renderer={this.props.renderer} workflows={this.props.renderer.initial_workflows} pages={this.props.renderer.initial_pages} context="library"/>
            </div>
        );
    }
}

export class FavouritesMenu extends LibraryMenu{

    render(){
        return (
            <div class="project-menu">
                <WorkflowFilter renderer={this.props.renderer} workflows={this.state.project_data} context="library"/>
            </div>
        );
    }

    componentDidMount(){
        let component = this;
        getFavourites(
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
                        <div class="home-item-title">{gettext("Recent projects")}</div>
                        <a class="collapsed-text-show-more" href={library_path}>{gettext("See all")}</a>
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
                        <div class="home-item-title">{gettext("Recent classrooms")}</div>
                        <a class="collapsed-text-show-more" href={library_path}>{gettext("See all")}</a>
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
                        <a class="collapsed-text-show-more" href={my_favourites_path}>{gettext("See all")}</a>
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
        if(data.author_id==user_id){
            overflow_links.push(<hr/>);
            overflow_links.push(this.getDeleteProject());
        }
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

    getDeleteProject(){
        if(!this.state.data.deleted)return (
            <div class="hover-shade" onClick={this.deleteProject.bind(this)}>
                <div>{gettext("Archive Project")}</div>
            </div>
        )
        else return([
            <div class="hover-shade" onClick={this.restoreProject.bind(this)}>
                <div>{gettext("Restore Project")}</div>
            </div>,
            <div class="hover-shade" onClick={this.deleteProjectHard.bind(this)}>
                <div>{gettext("Permanently Delete Project")}</div>
            </div>
        ])
    }

    deleteProject(){
        let component=this;
        if(window.confirm(gettext("Are you sure you want to delete this project?"))){
            deleteSelf(this.props.data.id,"project",true,()=>{
                component.setState({data:{...this.props.data,deleted:true}})
            });
        }
    }

    deleteProjectHard(){
        let component=this;
        if(window.confirm(gettext("Are you sure you want to permanently delete this project?"))){
            deleteSelf(this.props.data.id,"project",false,()=>{
                window.location=home_path;
            });
        }
    }

    restoreProject(){
        let component=this;
        restoreSelf(this.props.data.id,"project",()=>{
                component.setState({data:{...this.props.data,deleted:false}})
        });
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
                        <h4>{gettext("Permissions")}</h4>
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
                {Constants.getUserTag("author")}{Constants.getUserDisplay(author)}
            </div>,
            editors.filter(user=>user.id!=author.id).map(user=>
                <div class="user-name">
                    {Constants.getUserTag("edit")}{Constants.getUserDisplay(user)}
                </div>
            ),
            commenters.map(user=>
                <div class="user-name">
                    {Constants.getUserTag("comment")}{Constants.getUserDisplay(user)}
                </div>
            ),
            viewers.map(user=>
                <div class="user-name">
                    {Constants.getUserTag("view")}{Constants.getUserDisplay(user)}
                </div>
            ),
        ]
        if(this.state.users.published){
            users.push(
                <div class="user-name">
                    {Constants.getUserTag("view")}<span class="material-symbols-rounded">public</span> {gettext("All CourseFlow")}
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
                    <a id="activity-create-project" href={create_path_this_project.activity} class="hover-shade">{gettext("New activity")}</a>
                    <a id="course-create-project" href={create_path_this_project.course} class="hover-shade">{gettext("New course")}</a>
                    <a id="program-create-project" href={create_path_this_project.program} class="hover-shade">{gettext("New program")}</a>
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
                <WorkflowForMenu key={workflow.type+workflow.id} workflow_data={workflow} context={this.props.context}/>
            );
        } 
        let search_results=this.state.search_results.map(workflow=>
            <WorkflowForMenuCondensed key={workflow.type+workflow.id} workflow_data={workflow} context={this.props.context}/>
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
                            class="search-input"
                            autocomplete="off"
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
        // let searchDOM = $(this.searchDOM.current)
        // searchDOM.children("#workflow-search-input").on("focus",(evt)=>searchDOM.children(".create-dropdown").addClass("active"))
        // searchDOM.children("#workflow-search-input").on("blur",(evt)=>searchDOM.children(".create-dropdown").removeClass("active"))
    }

    searchWithin(request,response_function){
        let workflows = this.state.workflows.filter(workflow=>workflow.title.toLowerCase().indexOf(request)>=0);
        response_function(workflows);
    }

    searchWithout(request,response_function){
        searchAllObjects(request,{
                nresults:10
            },(response_data)=>{
            response_function(response_data.workflow_list);
        });
    }

    seeAll(){
        this.props.renderer.tiny_loader.startLoad();
        let search_filter = this.state.search_filter;
        searchAllObjects(search_filter,{nresults:0},(response_data)=>{
            this.setState({workflows:response_data.workflow_list,search_filter_lock:search_filter});
            this.props.renderer.tiny_loader.endLoad();
            $("#workflow-search .create-dropdown").removeClass("active");
            $("#workflow-search").attr("disabled",true);
            $("#workflow-search-input").attr("disabled",true);
        });
    }

    clearSearchLock(evt){
        this.setState({workflows:this.props.workflows,search_filter_lock:null})
        $("#workflow-search").attr("disabled",false);
        $("#workflow-search-input").attr("disabled",false);
        evt.stopPropagation();
    }

    defaultRender(){
        return (<renderers.WorkflowLoader/>);
    }
}

/*
As the workflow filter, but for the explore menu. There are several critical differences.
First, the data must be retrieved on every update to the filters/sort methods, as it will be paginated.
Second, the workflow type becomes its own filter. 
Third, a new discipline-based filter is added.
*/
export class ExploreFilter extends WorkflowFilter{
    constructor(props){
        super(props);
        this.filters = [
            {name:"activity",display:gettext("Activity")},
            {name:"course",display:gettext("Course")},
            {name:"program",display:gettext("Program")},
            {name:"project",display:gettext("Project")},
        ];
        this.sorts = [
            {name:"relevance",display:gettext("Relevance")},
            {name:"title",display:gettext("A-Z")},
            {name:"created_on",display:gettext("Creation date")},
        ];
        this.state={workflows:props.workflows,pages:this.props.renderer.initial_pages,has_searched:false,active_sort:0,active_filters:[],active_disciplines:[],reversed:false,from_saltise:false,content_rich:true}
        this.filterDOM=React.createRef();
        this.searchDOM=React.createRef();
        this.sortDOM=React.createRef();
        this.disciplineDOM=React.createRef();
    }

    render(){
        let workflows=this.state.workflows.map(workflow=>
            <WorkflowForMenu key={workflow.type+workflow.id} workflow_data={workflow} context={this.props.context}/>
        );
        return (
            [
                <div class="workflow-filter-top">
                    <div class="flex-middle">
                        <div id="workflow-search" ref={this.searchDOM}>
                            <input
                                placeholder={gettext("Search")}
                                onChange={debounce(this.searchChange.bind(this))}
                                id="workflow-search-input"
                                class="search-input"
                            />
                            <span class="material-symbols-rounded">search</span>
                        </div>
                        <button class="primary-button" disabled={this.state.has_searched} onClick={this.doSearch.bind(this)}>{gettext("Search")}</button>
                    </div>
                    <div class="workflow-filter-sort">
                        {this.getFromSaltise()}
                        {this.getContentRich()}
                        {this.getFilter()}
                        {this.getDisciplines()}
                        {this.getSort()}
                    </div>
                </div>,
                this.getInfo(),
                <div class="menu-grid">
                    {workflows}
                </div>,
                this.getPages()
            ]
        );
    }

    doSearch(){
        this.searchWithout($(this.searchDOM.current).children("#workflow-search-input")[0].value,this.searchResults.bind(this))
    }

    getInfo(){
        if(this.state.workflows==this.props.workflows)return (
            <p>{gettext("Enter a search term or filter then click 'search' to get started.")}</p>
        );
        return null;
    }

    getPages(){
        if(this.state.workflows.length>0){
            let page_buttons = [
                <button id="prev-page-button" disabled={(this.state.pages.current_page==1)} onClick={
                    this.toPage.bind(this,this.state.pages.current_page-1)
                }><span class="material-symbols-rounded">arrow_left</span></button>
            ];
            if(this.state.pages.current_page>3){
                page_buttons.push(
                    <button class="page-button" onClick = {this.toPage.bind(this,1)}>{1}</button>
                );
                if(this.state.pages.current_page>4){
                    page_buttons.push(
                        <div class="page-button no-button">...</div>
                    );
                }
            }

            for(let i=Math.max(this.state.pages.current_page-2,1);i<=Math.min(this.state.pages.current_page+2,this.state.pages.page_count);i++){
                let button_class="page-button";
                if(i==this.state.pages.current_page)button_class+=" active-page-button"
                page_buttons.push(
                    <button class={button_class} onClick = {this.toPage.bind(this,i)}>{i}</button>
                )
            }

            if(this.state.pages.current_page<this.state.pages.page_count-2){
                if(this.state.pages.current_page < this.state.pages.page_count-3){
                    page_buttons.push(
                        <div class="page-button no-button">...</div>
                    );
                }
                page_buttons.push(
                    <button class="page-button" onClick = {this.toPage.bind(this,this.state.pages.page_count)}>{this.state.pages.page_count}</button>
                );
            }

            page_buttons.push(
                <button id="next-page-button" disabled={(this.state.pages.current_page==this.state.pages.page_count)} onClick={
                    this.toPage.bind(this,this.state.pages.current_page+1)
                }><span class="material-symbols-rounded">arrow_right</span></button>
            )


            return [
                <p>
                    {gettext("Showing results")} {this.state.pages.results_per_page*(this.state.pages.current_page-1)+1}-{(this.state.pages.results_per_page*this.state.pages.current_page)} ({this.state.pages.total_results} {gettext("total results")})

                </p>,
                <div class="explore-page-buttons">
                        {page_buttons}
                </div>
            ]
        }else{
            return (
                <p>{gettext("No results were found.")}</p>
            );
        }
    }

    toPage(number){
        this.searchWithout($(this.searchDOM.current).children("#workflow-search-input")[0].value,this.searchResults.bind(this),number)
    }

    getFilter(){
        return (
            <div id="workflow-filter" ref={this.filterDOM} class="hover-shade">
                <div class={"workflow-sort-indicator hover-shade item-"+this.state.active_filters.length}>
                    <span class="material-symbols-rounded">filter_alt</span>
                    <div>{gettext("Type")}</div>
                </div>
                <div class="create-dropdown">
                    {this.filters.map((filter,i)=>{
                        let css_class="filter-option flex-middle";
                        if(this.state.active_filters.indexOf(filter.name)>=0)css_class+=" active";
                        return(
                            <div class={css_class} onClick={(evt)=>{
                            evt.stopPropagation();
                            this.filterChange(filter);
                            //This is very hacky, but if we're updating we need to re-open the sort dropdown
                            $(this.filterDOM.current).children(".create-dropdown").addClass("active");
                        }}>
                                <input type="checkbox" checked={this.state.active_filters.indexOf(filter.name)>=0}/>
                                {filter.display}
                            </div>
                        );
                    })}
                </div>
                <div attr_number={this.state.active_filters.length} class="dropdown-number-indicator">{this.state.active_filters.length}</div>
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
                        let css_class="filter-option filter-checkbox";
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

    getDisciplines(){
        let component = this;
        return (
            <div id="workflow-disciplines" ref={this.disciplineDOM} class="hover-shade">
                <div class={"workflow-sort-indicator hover-shade item-"+this.state.active_disciplines.length}>
                    <span class="material-symbols-rounded">science</span>
                    <div>{gettext("Discipline")}</div>
                </div>
                <div class="create-dropdown">
                    {this.props.disciplines.map((discipline,i)=>{
                        let css_class="filter-option flex-middle";
                        if(this.state.active_disciplines.indexOf(discipline.id)>=0)css_class+=" active";
                        return(
                            <div class={css_class} onClick={(evt)=>{
                            evt.stopPropagation();
                            this.disciplineChange(discipline);
                            //This is very hacky, but if we're updating we need to re-open the sort dropdown
                            $(this.disciplineDOM.current).children(".create-dropdown").addClass("active");
                        }}>
                                <input type="checkbox" checked={this.state.active_disciplines.indexOf(discipline.id)>=0}/>
                                {discipline.title}
                            </div>
                        );
                    })}
                </div>
                <div attr_number={this.state.active_disciplines.length} class="dropdown-number-indicator">{this.state.active_disciplines.length}</div>
            </div>
        );
    }

    getContentRich(){
        // let component=this;
        // return (
        //     <div title={gettext("Restrict results to workflows with three or more nodes")} id="content-rich" class="hover-shade" onClick={
        //         ()=>{
        //             component.setState({content_rich:!component.state.content_rich,has_searched:false})
        //         }
        //     }>
        //         <input type="checkbox" checked={this.state.content_rich}/>
        //         <label>{gettext("Exclude empty")}</label>
        //     </div>
        // );
    }

    getFromSaltise(){
        let component=this;
        return (
            <div title={gettext("Restrict results to content provided by SALTISE")} id="content-rich" class="hover-shade" onClick={
                ()=>{
                    component.setState({from_saltise:!component.state.from_saltise,has_searched:false});
                    component.doSearch();
                }
            }>
                <input type="checkbox" checked={this.state.from_saltise}/>
                <label>{gettext("SALTISE content")}</label>
            </div>
        );
    }

    componentDidMount(){
        makeDropdown(this.disciplineDOM.current)
        super.componentDidMount()
    }

    searchResults(response_data,pages){
        this.setState({workflows:response_data,pages:pages});
    }

    filterChange(filter,evt){
        let name = filter.name;
        let new_filter = this.state.active_filters.slice();
        if(new_filter.indexOf(name)>=0)new_filter.splice(new_filter.indexOf(name),1);
        else new_filter.push(name);
        this.setState({active_filters:new_filter,has_searched:false});
        // this.doSearch();
    }

    sortChange(index){
        if(this.state.active_sort==index)this.setState({reversed:!this.state.reversed,has_searched:false});
        else this.setState({active_sort:index,reversed:false,has_searched:false});
        // this.doSearch();
    }

    disciplineChange(discipline){
        let name = discipline.id;
        let new_filter = this.state.active_disciplines.slice();
        if(new_filter.indexOf(name)>=0)new_filter.splice(new_filter.indexOf(name),1);
        else new_filter.push(name);
        this.setState({active_disciplines:new_filter,has_searched:false});
        // this.doSearch();
    }

    searchChange(evt){
        this.setState({has_searched:false})
        /*let component=this;
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
        }*/
    }


    searchWithout(request,response_function,page_number=1){
        this.setState({has_searched:true})
        this.props.renderer.tiny_loader.startLoad();
        searchAllObjects(request,
            {
                nresults:20,
                published:true,
                full_search:true,
                disciplines:this.state.active_disciplines,
                types:this.state.active_filters,
                sort:this.sorts[this.state.active_sort].name,
                sort_reversed:this.state.reversed,
                page:page_number,
                from_saltise:this.state.from_saltise,
                content_rich:this.state.content_rich,
            },(response_data)=>{
            response_function(response_data.workflow_list,response_data.pages);
            this.props.renderer.tiny_loader.endLoad();
        });
    }


}


/*
A workflow card for a menu

Props must include workflow_data (serialized model) and context.
Context will determine which actions are added.

Can also optionally receive a clickAction prop to override the behaviour
on click, and "selected" to give it the selected css class.

*/
export class WorkflowForMenu extends React.Component{
    constructor(props){
        super(props);
        this.state={favourite:props.workflow_data.favourite};
        this.maindiv = React.createRef();
    }

    render(){
        let data = this.props.workflow_data;
        let css_class = "workflow-for-menu hover-shade "+data.type;
        if(this.props.selected)css_class+=" selected";

        let creation_text = gettext("Created");
        if(data.author && data.author !="None")creation_text+=" "+gettext("by")+" "+data.author;
        creation_text+=gettext(" on ")+data.created_on;

        return(
            <div ref={this.maindiv} class={css_class} onClick={this.clickAction.bind(this)} onMouseDown={(evt)=>{evt.preventDefault()}}>
                <div class="workflow-top-row">
                    <WorkflowTitle no_hyperlink={this.props.no_hyperlink} class_name="workflow-title" data={data}/>
                    {this.getTypeIndicator()}
                </div>
                <div class="workflow-created">
                    { creation_text}
                </div>
                {/*<CollapsibleText css_class="workflow-description" text={data.description} defaultText={gettext("No description")}/>*/}
                <div class="workflow-description collapsible-text" dangerouslySetInnerHTML={{ __html: data.description }}>
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
            <div class={"workflow-type-indicator "+type}>{Constants.capWords(type_text)}</div>
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
        );
        let workflows=[];
        if(this.props.workflow_data.type=="project" && !(this.props.workflow_data.workflow_count ==null))workflows.push(
            <div class="workflow-created">{this.props.workflow_data.workflow_count+" "+gettext("workflows")}</div>
        );
        if(this.props.workflow_data.type=="project" && this.props.workflow_data.has_liveproject && this.props.workflow_data.object_permission.role_type != Constants.role_keys["none"])workflows.push(
            <a class="workflow-created workflow-live-classroom hover-shade" href={
                update_path["liveproject"].replace("0",this.props.workflow_data.id)
            }>
                <span class="material-symbols-rounded small-inline" title={gettext("Live Classroom")}>group</span>{" "+gettext("Live Classroom")}
            </a>
        );
        if(this.props.workflow_data.is_linked)workflows.push(
            <div class="workflow-created linked-workflow-warning" title={gettext("Warning: linking the same workflow to multiple nodes can result in loss of readability if you are associating parent workflow outcomes with child workflow outcomes.")}><span class="material-symbols-rounded red filled small-inline">error</span>{" "+gettext("Already in use")}</div>
        )
        return (
            <div class="workflow-buttons-row">
                <div>
                    {buttons}
                </div>
                <div>
                    {workflows}
                </div>
            </div>
        );
    }

    clickAction(){
        if(this.props.selectAction){
            this.props.selectAction(this.props.workflow_data.id);
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

